# Pagamentos com Stripe

A loja usa o **Stripe Checkout hospedado**: o carrinho do site chama
`POST /api/checkout`, o servidor recalcula os itens a partir da planilha
(aba `CATALOGO`) e redireciona o cliente para a página de pagamento do Stripe.
O pedido só é registrado, e o estoque só é baixado, quando o Stripe confirma o
pagamento pelo webhook `POST /api/stripe/webhook`.

## Como funciona

1. **Carrinho** (`/cart`): o navegador envia apenas `slug`, `cor` e
   `quantidade` de cada item. Preço e nome enviados pelo navegador são
   ignorados.
2. **`POST /api/checkout`** (`server/checkout.ts`):
   - recusa carrinho malformado (máx. 20 linhas e 20 unidades por linha);
   - procura cada produto no catálogo e usa o `PREÇO FINAL` da planilha,
     convertido para centavos;
   - valida a cor contra a coluna `CORES` (produtos de cor única não aceitam
     cor);
   - valida o `ESTOQUE`, somando as cores do mesmo produto;
   - cria uma Checkout Session com `mode: payment`, `currency: brl`,
     cartão e Pix, coleta de endereço de entrega (somente Brasil) e telefone,
     e devolve a URL do Stripe.
3. **Pagamento**: cartão é confirmado na hora. Pix é **assíncrono**: o cliente
   recebe um QR Code válido por 30 minutos e a confirmação chega depois.
4. **Webhook** (`server/stripeWebhook.ts`):
   - verifica a assinatura `Stripe-Signature` com o corpo bruto e
     `STRIPE_WEBHOOK_SECRET` (requisições sem assinatura válida recebem 400);
   - ignora eventos repetidos pelo `id` do evento (tabela `stripe_events`);
   - `checkout.session.completed`: grava o pedido como `paid` (cartão) ou
     `pending` (Pix aguardando);
   - `checkout.session.async_payment_succeeded`: marca `paid`;
   - `checkout.session.async_payment_failed`: marca `failed`;
   - quando o pedido fica `paid`, baixa o estoque na planilha uma única vez.
     Se o estoque não cobrir a venda (duas compras simultâneas da última
     peça), ele fica em zero e o problema é gravado em `orders.stock_issues`
     para revisão manual.
   - se algo falhar (banco ou planilha fora do ar), responde 500 e o Stripe
     reenvia o evento automaticamente.
5. **Páginas de retorno**: `/checkout/success` (limpa o carrinho e mostra se o
   pagamento está confirmado ou aguardando Pix) e `/checkout/cancel`.

Os pedidos ficam na tabela `orders` do Postgres (`DATABASE_URL`). Sem
`DATABASE_URL` (desenvolvimento local) eles ficam em `data/orders.json`, que
não é versionado.

## Variáveis de ambiente

| Variável | Onde | Para quê |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | servidor | Chave secreta (`sk_test_…` em teste, `sk_live_…` em produção). Sem ela o checkout responde 503. |
| `STRIPE_WEBHOOK_SECRET` | servidor | Segredo de assinatura do endpoint de webhook (`whsec_…`). Cada endpoint, e o Stripe CLI, tem o seu. |
| `PUBLIC_SITE_URL` | servidor | Domínio público do site, sem barra no final, usado em `success_url` e `cancel_url`. Se vazio, usa `APP_URL`. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | navegador | **Não é necessária** com o Checkout hospedado. Só seria usada se o Stripe.js fosse adicionado ao front. |

Nunca coloque as chaves no código nem em variáveis com prefixo `VITE_` (essas
vão para o navegador). Use `.env` localmente (já está no `.gitignore`) e as
variáveis de ambiente da Vercel no deploy.

## Ativação (passo a passo)

### 1. Banco de dados

Crie as tabelas novas (`stripe_events` e `orders`) no Postgres de produção.
Com a `DATABASE_URL` de produção no ambiente local:

```bash
npm run db:migrate
```

O comando aplica só as migrações que ainda não rodaram (o mesmo acontece em
`npm run users:bootstrap`).

### 2. Painel Stripe

1. Em **Configurações → Pagamentos → Formas de pagamento**, confirme que
   **Cartões** e **Pix** estão ativos (em modo de teste e em produção). Se o
   Pix não estiver ativo, a criação da sessão falha; ative-o ou remova `'pix'`
   de `payment_method_types` em `server/checkout.ts`.
2. Em **Desenvolvedores → Chaves de API**, copie a **chave secreta**. Em
   produção, prefira uma **chave restrita** com permissão de escrita em
   *Checkout Sessions* e leitura em *Products/Prices*.
3. Em **Desenvolvedores → Webhooks → Adicionar endpoint**:
   - URL: `https://<seu-domínio>/api/stripe/webhook`
   - Eventos:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
   - Salve e copie o **segredo de assinatura** (`whsec_…`).
4. Repita o passo 3 em modo de teste se quiser testar em um deploy de Preview
   (cada endpoint tem um segredo diferente).

### 3. Vercel

Em **Project → Settings → Environment Variables**, cadastre:

- `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`: valores **live** só no
  ambiente *Production*; valores **de teste** em *Preview* (e *Development*,
  se usar `vercel env pull`).
- `PUBLIC_SITE_URL`: o domínio público em *Production*.

Marque as chaves como *Sensitive*. Depois faça um novo deploy para que as
variáveis passem a valer.

## Testando em modo de teste com o Stripe CLI

1. Instale o [Stripe CLI](https://docs.stripe.com/stripe-cli) e entre na conta:

   ```bash
   stripe login
   ```

2. No `.env` local, use a chave **de teste** em `STRIPE_SECRET_KEY` e deixe
   `PUBLIC_SITE_URL=http://localhost:5174`.
3. Encaminhe os webhooks para a API local (porta `API_PORT`, padrão 8788):

   ```bash
   stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:8788/api/stripe/webhook
   ```

   O comando mostra um segredo `whsec_…`: coloque-o em `STRIPE_WEBHOOK_SECRET`
   e reinicie a API.
4. Suba o site com `npm run dev`, adicione produtos ao carrinho e clique em
   **Finalizar compra**.
5. Pague com os dados de teste:
   - Cartão aprovado: `4242 4242 4242 4242`, qualquer validade futura e
     qualquer CVC.
   - Cartão recusado: `4000 0000 0000 0002`.
   - Pix: escolha Pix; a página de teste do Stripe permite simular a
     aprovação ou a falha do pagamento.
6. Confira no terminal do `stripe listen` que os eventos receberam `200`, o
   pedido em `data/orders.json` (ou na tabela `orders`) e a coluna `ESTOQUE`
   na planilha.
7. Para checar a idempotência, reenvie um evento já entregue:

   ```bash
   stripe events resend <id_do_evento>
   ```

   A resposta deve trazer `"duplicate": true` e o estoque não muda.

Testes automatizados (sem rede e sem chaves reais):

```bash
npm run test:checkout
```

## Observações

- A entrega hoje é só em Curitiba e região; o Checkout aceita endereços de
  todo o Brasil e não cobra frete. Para cobrar frete, adicione
  `shipping_options` em `buildCheckoutSessionParams`.
- O estoque é por produto (coluna `ESTOQUE`), não por cor.
- O estoque não é reservado durante o pagamento. Por isso o Pix expira em
  30 minutos e eventuais vendas acima do estoque ficam registradas em
  `orders.stock_issues`.
- Se a planilha falhar no meio da baixa de um pedido com vários produtos, o
  reenvio do Stripe repete a baixa de todo o pedido; confira o estoque desses
  produtos manualmente nesse caso.
