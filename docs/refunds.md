# Solicitações de reembolso

O reembolso não é automático. O cliente pede em `/reembolso`, a Bella revisa
no painel do site e faz o estorno manualmente no painel da Stripe. Marcar a
solicitação como aprovada ou recusada **não movimenta dinheiro**.

## Como funciona

1. **Página `/reembolso`** (en-US, pt-BR e es-ES): o cliente informa o número
   do pedido, o e-mail usado na compra e o motivo (lista curta + campo livre).
   O número do pedido é o id da Checkout Session (`cs_live_…`), mostrado na
   página de confirmação do pedido e usado por ela no link direto.
2. **`POST /api/refunds`**:
   - mesmo limite do checkout: 10 tentativas por IP a cada 10 minutos;
   - o servidor procura o pedido em `orders` e exige `status = 'paid'`;
   - compara o e-mail guardado no pedido (sem diferenciar maiúsculas);
   - se o pedido não existir, não estiver pago ou o e-mail não bater, responde
     exatamente a mesma coisa que um pedido válido, sem revelar a diferença;
   - grava uma linha em `refund_requests`; a coluna `session_id` é única, então
     o mesmo pedido nunca entra duas vezes.
3. **Aviso à Bella**:
   - lista em `/admin/refunds` (rota de admin/moderação) com os dados do
     pedido, motivo, status e botões de aprovar/recusar;
   - e-mail a cada nova solicitação, quando `RESEND_API_KEY` e
     `REFUND_NOTIFY_EMAIL` estiverem definidos. Sem essas variáveis o site
     continua funcionando e só a lista recebe.

O formulário não guarda o e-mail digitado: ele só serve para conferir o
pedido. A lista de admin lê o e-mail, o nome e os itens do pedido original e
não expõe telefone nem endereço de entrega.

## Migração

`server/persistence/migrations/0004_refund_requests.sql` cria `refund_requests`.
Com a `DATABASE_URL` de produção no ambiente local:

```bash
npm run db:migrate
```

A migração só cria a tabela e o índice; não apaga nem altera dados existentes.

## Variáveis de ambiente

| Variável | Onde | Para quê |
| --- | --- | --- |
| `RESEND_API_KEY` | servidor | Chave da API do Resend. Sem ela, nenhum e-mail sai. |
| `REFUND_NOTIFY_EMAIL` | servidor | Caixa que recebe o aviso (o e-mail da Bella). |
| `REFUND_EMAIL_FROM` | servidor | Remetente verificado no Resend; opcional. Sem ela, o padrão é `onboarding@resend.dev`, que só entrega para o dono da conta Resend. |

As duas primeiras precisam existir juntas. Nenhuma delas pode ter prefixo
`VITE_`.

## Ativação do e-mail (passo a passo)

1. Criar uma conta em [resend.com](https://resend.com) (o Administrador faz;
   nenhum agente cria conta).
2. Verificar o domínio que vai assinar o e-mail: **Domains → Add Domain**,
   cadastrar os registros DNS que o Resend mostrar e esperar a verificação.
   Para testar antes de ter domínio, usar o remetente
   `onboarding@resend.dev`, que só entrega para o e-mail dono da conta.
3. Criar a chave em **API Keys → Create API Key**, com permissão de envio.
4. Na Vercel, em **Project → Settings → Environment Variables**, cadastrar em
   *Production* (e em *Preview*, se quiser testar antes):
   - `RESEND_API_KEY`: a chave criada;
   - `REFUND_NOTIFY_EMAIL`: o e-mail da Bella;
   - `REFUND_EMAIL_FROM`: por exemplo `Togurumi <pedidos@seudominio.com>`
     (opcional; obrigatório para enviar a alguém que não seja o dono da conta).
   Marcar a chave como *Sensitive*.
5. Fazer um novo deploy para as variáveis valerem.
6. Rodar a migração acima no banco de produção.
7. Testar: enviar uma solicitação de um pedido de teste e conferir a lista em
   `/admin/refunds` e o e-mail.

Sem as variáveis, a solicitação aparece só na lista; nada quebra.

## Pendências para a Bella

- Confirmar o texto do direito de arrependimento de 7 dias na página
  `/reembolso`, na pergunta nova do FAQ e nos avisos de e-mail. O texto está
  marcado como rascunho no código.
- O FAQ do site é editável pelo painel. Se o conteúdo de produção já tiver
  sido editado, a pergunta nova precisa ser acrescentada pelo editor do FAQ;
  o texto padrão do código só aparece quando não há conteúdo gravado.

## Reembolso manual na Stripe

1. Abrir **Payments** no painel da Stripe e localizar o pagamento pelo id da
   Checkout Session ou pelo e-mail do cliente.
2. Reembolsar o valor combinado (**Refund**).
3. Voltar em `/admin/refunds` e marcar a solicitação como aprovada ou recusada.

## Testes

```bash
npm run test:refunds
```

Cobrem a validação do formulário, a conferência de e-mail e pagamento, a
unicidade por pedido, a migração com PGlite e o envio ao Resend (com `fetch`
falso, sem rede).
