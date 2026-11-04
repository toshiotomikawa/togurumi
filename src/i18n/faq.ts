import type { SupportedLocale } from '../lib/i18n'

export type FaqItem = {
  question: string
  answer: string
}

export type FaqContent = {
  eyebrow: string
  title: string
  intro: string
  items: FaqItem[]
}

const enUS: FaqContent = {
  eyebrow: 'FAQ',
  title: 'FAQ',
  intro: "Here's everything we get asked most often. Don't see your question? Reach out on the contact page.",
  items: [
    {
      question: 'How long does each piece take to make?',
      answer:
        "Most amigurumi take a few days to a couple of weeks from start to finish, depending on size and detail. If a piece is already listed in the shop, it's ready to ship right away.",
    },
    {
      question: 'Do you take custom orders?',
      answer:
        "Yes! Custom characters, colors, and sizes are welcome. Reach out through the contact page with your idea and we'll talk through timing and pricing.",
    },
    {
      question: 'How should I care for my amigurumi?',
      answer:
        'Spot clean with a damp cloth and mild soap whenever possible. If it needs a full wash, hand wash in cold water and reshape while damp, then let it air dry flat away from direct sunlight.',
    },
    {
      question: 'Are they safe for kids?',
      answer:
        'Pieces made with safety eyes and tightly secured parts are fine for older kids, but small parts can be a choking hazard for babies and toddlers. If the amigurumi is for a little one, let us know and we can adjust the construction.',
    },
    {
      question: 'How do shipping and delivery work?',
      answer:
        'For now, delivery is available only in Curitiba and the metropolitan region. Shipping to all Brazilian states is planned for the future. Orders are packed with care, and delivery details are arranged at checkout.',
    },
    {
      question: 'What materials do you use?',
      answer:
        'Mostly cotton and acrylic yarn, with polyester stuffing. Eyes and other small details are securely fastened for durability. If you have a material preference or allergy, let us know.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        "Online checkout isn't open just yet, we'll update this page as soon as it is. In the meantime, reach out through the contact page to arrange a purchase.",
    },
    {
      question: 'Can I return or exchange an item?',
      answer:
        "Since each piece is handmade, we don't exchange pieces for a change of mind, except for the 7-day right of withdrawal on online purchases (see the refund question). If your order arrives damaged or different from what was agreed, get in touch and we'll make it right.",
    },
    // Draft copy: Bella confirms the 7-day right of withdrawal before launch.
    {
      question: 'Can I change my mind about an online order?',
      answer:
        'Yes. For purchases made on this website, you can withdraw within 7 days of receiving the order. To request a refund, use the [Request a refund page](/reembolso) and send the order number and the e-mail used at checkout. Bella reviews the order and issues the refund through Stripe.',
    },
  ],
}

const ptBR: FaqContent = {
  eyebrow: 'FAQ',
  title: 'Dúvidas',
  intro: 'Aqui estão as dúvidas que mais recebemos. Não encontrou a sua? Fale com a gente pela página de contato.',
  items: [
    {
      question: 'Quanto tempo leva para fazer cada peça?',
      answer:
        'A maioria dos amigurumis leva de alguns dias a algumas semanas, dependendo do tamanho e dos detalhes. Se a peça já está na loja, ela está pronta para envio imediato.',
    },
    {
      question: 'Vocês fazem encomendas personalizadas?',
      answer:
        'Sim! Personagens, cores e tamanhos personalizados são bem-vindos. Fale com a gente pela página de contato com sua ideia e combinamos prazo e valor.',
    },
    {
      question: 'Como cuidar do meu amigurumi?',
      answer:
        'Sempre que possível, limpe apenas o local sujo com um pano úmido e sabão neutro. Se precisar de uma lavagem completa, lave à mão em água fria, dê forma à peça ainda úmida e deixe secar na horizontal, longe do sol direto.',
    },
    {
      question: 'É seguro para crianças?',
      answer:
        'Peças feitas com olhos de segurança e partes bem fixadas são adequadas para crianças maiores, mas peças pequenas podem ser perigosas para bebês e crianças pequenas. Se o amigurumi for para um bebê, é só avisar que a gente ajusta a confecção.',
    },
    {
      question: 'Como funciona o envio?',
      answer:
        'Por enquanto, as entregas são somente para Curitiba e região metropolitana. Futuramente, atenderemos todos os estados do Brasil. Os pedidos são embalados com cuidado e os detalhes de entrega são combinados no fechamento da compra.',
    },
    {
      question: 'Quais materiais vocês usam?',
      answer:
        'Principalmente fio de algodão e acrílico, com enchimento de poliéster. Olhos e outros detalhes pequenos são bem fixados para durar. Se você tem preferência ou alergia a algum material, é só avisar.',
    },
    {
      question: 'Quais formas de pagamento são aceitas?',
      answer:
        'A finalização de compra online ainda não está disponível, vamos atualizar esta página assim que estiver. Por enquanto, fale com a gente pela página de contato para combinar a compra.',
    },
    {
      question: 'Posso trocar ou devolver um produto?',
      answer:
        'Como cada peça é feita à mão, não fazemos trocas por simples mudança de ideia, mas compras feitas no site têm o direito de arrependimento de 7 dias (veja a pergunta sobre reembolso). Se o pedido chegar danificado ou diferente do combinado, fale com a gente que resolvemos.',
    },
    // Rascunho: a Bella confirma o direito de arrependimento de 7 dias antes do lançamento.
    {
      question: 'Posso me arrepender de uma compra feita no site?',
      answer:
        'Sim. Em compras pela internet, você pode desistir da compra em até 7 dias corridos a partir do recebimento. Para pedir o reembolso, use a página [Solicitar reembolso](/reembolso) e informe o número do pedido e o e-mail usado na compra. A Bella analisa o pedido e faz o reembolso pela Stripe.',
    },
  ],
}

const esES: FaqContent = {
  eyebrow: 'Preguntas frecuentes',
  title: 'Preguntas frecuentes',
  intro: 'Aquí están las dudas que más recibimos. ¿No encontraste la tuya? Escríbenos en la página de contacto.',
  items: [
    {
      question: '¿Cuánto tiempo toma hacer cada pieza?',
      answer:
        'La mayoría de los amigurumis tardan desde unos días hasta un par de semanas, según el tamaño y los detalles. Si la pieza ya está en la tienda, está lista para enviarse de inmediato.',
    },
    {
      question: '¿Hacen pedidos personalizados?',
      answer:
        '¡Sí! Personajes, colores y tamaños personalizados son bienvenidos. Escríbenos por la página de contacto con tu idea y conversamos sobre tiempos y precio.',
    },
    {
      question: '¿Cómo cuido mi amigurumi?',
      answer:
        'Siempre que sea posible, limpia solo la zona sucia con un paño húmedo y jabón neutro. Si necesita un lavado completo, lava a mano con agua fría, dale forma mientras está húmedo y déjalo secar en horizontal, lejos del sol directo.',
    },
    {
      question: '¿Es seguro para niños?',
      answer:
        'Las piezas hechas con ojos de seguridad y partes bien fijadas son adecuadas para niños más grandes, pero las piezas pequeñas pueden ser un riesgo para bebés y niños pequeños. Si el amigurumi es para un bebé, avísanos y ajustamos la confección.',
    },
    {
      question: '¿Cómo funciona el envío?',
      answer:
        'Por ahora, las entregas son solo para Curitiba y su región metropolitana. Más adelante enviaremos a todos los estados de Brasil. Los pedidos se empacan con cuidado y los detalles de entrega se coordinan al finalizar la compra.',
    },
    {
      question: '¿Qué materiales usan?',
      answer:
        'Principalmente hilo de algodón y acrílico, con relleno de poliéster. Los ojos y otros detalles pequeños están bien fijados para que duren. Si tienes alguna preferencia o alergia a algún material, avísanos.',
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer:
        'El pago en línea todavía no está disponible, actualizaremos esta página en cuanto lo esté. Por ahora, escríbenos por la página de contacto para coordinar la compra.',
    },
    {
      question: '¿Puedo devolver o cambiar un producto?',
      answer:
        'Como cada pieza es hecha a mano, no hacemos cambios por simple cambio de opinión, pero las compras hechas en el sitio tienen el derecho de desistimiento de 7 días (mira la pregunta sobre reembolsos). Si tu pedido llega dañado o distinto a lo acordado, contáctanos y lo resolvemos.',
    },
    // Borrador: Bella confirma el derecho de desistimiento de 7 días antes del lanzamiento.
    {
      question: '¿Puedo arrepentirme de una compra hecha en el sitio?',
      answer:
        'Sí. En compras hechas por internet, puedes desistir de la compra en hasta 7 días corridos desde la entrega. Para pedir el reembolso, usa la página [Solicitar reembolso](/reembolso) e indica el número del pedido y el correo usado en la compra. Bella revisa el pedido y hace el reembolso por Stripe.',
    },
  ],
}

export function getFaqContent(locale: SupportedLocale): FaqContent {
  if (locale === 'pt-BR') return ptBR
  if (locale === 'es-ES') return esES
  return enUS
}
