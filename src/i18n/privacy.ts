import type { SupportedLocale } from '../lib/i18n'

export type PrivacySection = {
  id: string
  title: string
  paragraphs: string[]
}

export type PrivacyContent = {
  title: string
  lastUpdated: string
  intro: string
  sections: PrivacySection[]
}

const enUS: PrivacyContent = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: August 6, 2026',
  intro:
    'Togurumi is a small handmade crochet studio with a portfolio, a journal, and a shop catalogue. This page describes what the site actually does with information: what stays in your browser, what reaches our server, and which outside services your browser talks to while a page loads.',
  sections: [
    {
      id: 'who',
      title: '1. Who we are',
      paragraphs: [
        'Togurumi is run by Bella, an independent crochet artist based in Brazil, who decides how the information described on this page is handled.',
        'For anything related to privacy — a question, a correction, or a removal request — write to togurumi@gmail.com.',
      ],
    },
    {
      id: 'browser-data',
      title: '2. Information kept in your browser',
      paragraphs: [
        'Your display preference (day, night, or follow the system) and your language choice (English, Portuguese, or Spanish) are saved in your browser so the site looks the same on your next visit.',
        'Your shopping bag is kept in your browser too. The pieces and colours you add stay on your device: the site has no checkout, and it does not send the contents of your bag to us or to anyone else.',
        'While a signed-in member of the team is editing page text, the unsaved draft is backed up in that person’s own browser so it survives a refresh. This never happens for visitors, and the backup is discarded once the draft is saved or cancelled.',
        'None of this browser-side information is transmitted to us. You can inspect or erase all of it at any time by clearing this site’s data in your browser settings.',
      ],
    },
    {
      id: 'reviews',
      title: '3. Reviews you choose to send',
      paragraphs: [
        'The review form asks for a display name, a rating from one to five, and a comment. When you submit it, that name, rating, comment, and the moment of submission are stored on our server and published on the site, where anyone can read them.',
        'Please use only a name you are comfortable showing in public, and avoid putting addresses, phone numbers, or other personal details into the comment.',
        'To limit spam, the server briefly remembers the network address of the most recent submission so that the same address cannot post more than once per minute. That check is held in memory only, is never written alongside your review, and is lost when the server restarts.',
        'A published review stays online until the Togurumi team removes it. You can ask for yours to be taken down by writing to togurumi@gmail.com and telling us which one is yours.',
      ],
    },
    {
      id: 'team-area',
      title: '4. The team area',
      paragraphs: [
        'The site has no visitor accounts. Browsing, searching, reading the journal, and using the shopping bag never require signing in. The sign-in page exists only for Bella and the people who help her manage the site.',
        'A team account holds a username, a display name, an optional e-mail address, and the permission level of that account. Passwords are stored only in a protected form that cannot be read back, and are never shown to anyone, including us.',
        'Failed sign-in attempts are counted in the server’s memory, and after several failures further attempts from the same origin are refused for a short while. These counters exist in memory only and are cleared when the server restarts.',
        'The sign-in page shows a Google sign-in button that is disabled and marked as coming soon. It cannot be used, and no information is exchanged with Google through it.',
      ],
    },
    {
      id: 'cookies',
      title: '5. Cookies',
      paragraphs: [
        'The site sets a single cookie, and only after someone from the team signs in. It carries a session identifier, can be read only by our server, is not shared with other sites, and lasts up to thirty days, renewed while the session stays in use. Signing out removes it.',
        'For as long as a team session is open, it stays tied to the browser it was opened in. If that changes, the session is closed and a new sign-in is required.',
        'There are no advertising cookies, no analytics cookies, and no third-party trackers on this site. Because the only cookie is strictly necessary for the team area, visitors are not asked for cookie consent.',
      ],
    },
    {
      id: 'outside-services',
      title: '6. Outside services',
      paragraphs: [
        'The site loads its typefaces from Google Fonts. Loading a font means your browser connects to Google’s servers, which receive the technical details that every web request carries, such as your network address and your browser version.',
        'Product photos are stored and delivered by ImageKit, so opening a shop page connects your browser to ImageKit’s servers in the same way.',
        'The shop catalogue is read by our server from a private Google spreadsheet that belongs to Togurumi. That request is made by the server, carries no visitor information, and the spreadsheet holds product data only.',
        'Links to Instagram and YouTube open those platforms in a new tab, and nothing from them is embedded in our pages. Once you follow such a link, that platform’s own privacy policy applies. Writing to our e-mail address means the message is handled by that e-mail provider.',
        'We do not use analytics, advertising networks, or behavioural tracking of any kind.',
      ],
    },
    {
      id: 'retention',
      title: '7. How long information is kept',
      paragraphs: [
        'Preferences and bag contents stay in your browser until you clear them. The team session cookie lasts up to thirty days from its last use. A published review stays until it is removed. Team account records stay for as long as that person helps run the site.',
        'Beyond these, the site defines no fixed retention periods, and the application itself keeps no access logs. Services used to host and deliver the site may keep technical records under their own policies.',
      ],
    },
    {
      id: 'choices',
      title: '8. Your choices',
      paragraphs: [
        'You can use the whole site without sending anything to us. Preferences and the shopping bag never leave your device, and the review form is entirely optional.',
        'You can erase the stored preferences and bag at any time through your browser settings. Blocking third-party requests in your browser will also stop the font and image services described above, although parts of the page may then look different.',
        'If you would rather not publish a review, you can write to togurumi@gmail.com instead.',
      ],
    },
    {
      id: 'rights',
      title: '9. Rights and how to reach us',
      paragraphs: [
        'Brazil’s General Data Protection Law (LGPD, Law No. 13,709/2018) gives you rights over personal data concerning you, including confirmation that it is being processed, access to it, correction of anything inaccurate, and deletion where applicable.',
        'This page is written to describe honestly how the site works. It is not a legal opinion and it does not certify compliance with any law. To exercise the rights above, or to ask a question about this policy, write to togurumi@gmail.com and we will answer as soon as we reasonably can.',
      ],
    },
    {
      id: 'updates',
      title: '10. Changes to this policy',
      paragraphs: [
        'When the site changes in a way that affects this description — a new feature, or a new outside service — this page is updated and the date at the top changes with it. Earlier versions are not kept online, so it is worth re-reading this page whenever that date has moved.',
      ],
    },
  ],
}

const ptBR: PrivacyContent = {
  title: 'Política de Privacidade',
  lastUpdated: 'Última atualização: 6 de agosto de 2026',
  intro:
    'O Togurumi é um pequeno ateliê de crochê artesanal, com portfólio, blog e catálogo da loja. Esta página descreve o que o site realmente faz com as informações: o que fica no seu navegador, o que chega ao nosso servidor e com quais serviços externos o seu navegador se comunica ao carregar uma página.',
  sections: [
    {
      id: 'who',
      title: '1. Quem somos',
      paragraphs: [
        'O Togurumi é mantido por Bella, artesã de crochê independente sediada no Brasil, que decide como as informações descritas nesta página são tratadas.',
        'Para qualquer assunto de privacidade — uma dúvida, uma correção ou um pedido de remoção — escreva para togurumi@gmail.com.',
      ],
    },
    {
      id: 'browser-data',
      title: '2. Informações guardadas no seu navegador',
      paragraphs: [
        'A sua preferência de exibição (dia, noite ou acompanhar o sistema) e a sua escolha de idioma (português, inglês ou espanhol) ficam salvas no seu navegador, para que o site continue igual na próxima visita.',
        'A sua sacola também fica no seu navegador. As peças e cores que você adiciona permanecem no seu dispositivo: o site não tem checkout e não envia o conteúdo da sacola para nós nem para terceiros.',
        'Enquanto alguém da equipe, já autenticado, edita os textos de uma página, o rascunho não salvo é copiado no navegador dessa pessoa para sobreviver a uma atualização da página. Isso nunca acontece com visitantes, e a cópia é descartada quando o rascunho é salvo ou cancelado.',
        'Nenhuma dessas informações do navegador é transmitida para nós. Você pode consultá-las ou apagá-las quando quiser, limpando os dados deste site nas configurações do navegador.',
      ],
    },
    {
      id: 'reviews',
      title: '3. Avaliações que você decide enviar',
      paragraphs: [
        'O formulário de avaliação pede um nome de exibição, uma nota de um a cinco e um comentário. Ao enviar, esse nome, a nota, o comentário e o momento do envio são armazenados no nosso servidor e publicados no site, onde qualquer pessoa pode ler.',
        'Use apenas um nome que você se sinta à vontade de mostrar publicamente e evite incluir endereços, telefones ou outros dados pessoais no comentário.',
        'Para limitar spam, o servidor guarda por pouco tempo o endereço de rede do envio mais recente, de modo que o mesmo endereço não possa publicar mais de uma vez por minuto. Essa verificação fica apenas em memória, nunca é gravada junto da sua avaliação e se perde quando o servidor reinicia.',
        'Uma avaliação publicada permanece no ar até que a equipe do Togurumi a remova. Você pode pedir a remoção da sua escrevendo para togurumi@gmail.com e indicando qual é a sua.',
      ],
    },
    {
      id: 'team-area',
      title: '4. A área da equipe',
      paragraphs: [
        'O site não tem contas para visitantes. Navegar, buscar, ler o blog e usar a sacola nunca exigem login. A página de acesso existe apenas para a Bella e para as pessoas que ajudam a cuidar do site.',
        'Uma conta da equipe guarda um nome de usuário, um nome de exibição, um e-mail opcional e o nível de permissão dessa conta. As senhas são armazenadas somente em uma forma protegida que não pode ser lida de volta, e não são exibidas para ninguém, nem para nós.',
        'As tentativas de acesso malsucedidas são contadas na memória do servidor e, após algumas falhas, novas tentativas da mesma origem são recusadas por um período curto. Esses contadores existem apenas em memória e são zerados quando o servidor reinicia.',
        'A página de acesso mostra um botão de entrar com o Google que está desativado e marcado como "em breve". Ele não pode ser usado e nenhuma informação é trocada com o Google por meio dele.',
      ],
    },
    {
      id: 'cookies',
      title: '5. Cookies',
      paragraphs: [
        'O site define um único cookie, e somente depois que alguém da equipe faz login. Ele carrega um identificador de sessão, só pode ser lido pelo nosso servidor, não é compartilhado com outros sites e dura até trinta dias, renovados enquanto a sessão continua em uso. Sair da conta o remove.',
        'Enquanto uma sessão da equipe está aberta, ela permanece vinculada ao navegador em que foi iniciada. Se isso mudar, a sessão é encerrada e um novo login é necessário.',
        'Não há cookies de publicidade, cookies de análise nem rastreadores de terceiros neste site. Como o único cookie é estritamente necessário para a área da equipe, não pedimos consentimento de cookies aos visitantes.',
      ],
    },
    {
      id: 'outside-services',
      title: '6. Serviços externos',
      paragraphs: [
        'O site carrega suas fontes tipográficas do Google Fonts. Carregar uma fonte significa que o seu navegador se conecta aos servidores do Google, que recebem os dados técnicos presentes em qualquer requisição web, como o seu endereço de rede e a versão do seu navegador.',
        'As fotos dos produtos são armazenadas e entregues pelo ImageKit, então abrir uma página da loja conecta o seu navegador aos servidores do ImageKit da mesma maneira.',
        'O catálogo da loja é lido pelo nosso servidor a partir de uma planilha privada do Google que pertence ao Togurumi. Essa requisição parte do servidor, não leva nenhuma informação de visitantes, e a planilha contém apenas dados de produtos.',
        'Os links para o Instagram e o YouTube abrem essas plataformas em uma nova aba, e nada delas é incorporado às nossas páginas. Ao seguir um desses links, passa a valer a política de privacidade da própria plataforma. Escrever para o nosso e-mail significa que a mensagem é tratada pelo provedor desse e-mail.',
        'Não usamos analytics, redes de publicidade nem rastreamento comportamental de nenhum tipo.',
      ],
    },
    {
      id: 'retention',
      title: '7. Por quanto tempo as informações ficam guardadas',
      paragraphs: [
        'As preferências e o conteúdo da sacola ficam no seu navegador até que você os apague. O cookie de sessão da equipe dura até trinta dias a partir do último uso. Uma avaliação publicada permanece até ser removida. Os registros das contas da equipe permanecem enquanto a pessoa ajudar a cuidar do site.',
        'Além desses casos, o site não define prazos fixos de retenção, e a aplicação em si não mantém registros de acesso. Serviços usados para hospedar e entregar o site podem manter registros técnicos conforme suas próprias políticas.',
      ],
    },
    {
      id: 'choices',
      title: '8. Suas opções',
      paragraphs: [
        'Você pode usar o site inteiro sem nos enviar nada. As preferências e a sacola nunca saem do seu dispositivo, e o formulário de avaliação é totalmente opcional.',
        'Você pode apagar as preferências e a sacola guardadas a qualquer momento pelas configurações do navegador. Bloquear requisições de terceiros no navegador também interrompe os serviços de fontes e imagens descritos acima, embora partes da página possam ficar com outra aparência.',
        'Se preferir não publicar uma avaliação, você pode escrever para togurumi@gmail.com.',
      ],
    },
    {
      id: 'rights',
      title: '9. Direitos e como falar conosco',
      paragraphs: [
        'A Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018) garante direitos sobre os dados pessoais relativos a você, incluindo a confirmação de que existe tratamento, o acesso a esses dados, a correção do que estiver incorreto e a exclusão quando cabível.',
        'Esta página foi escrita para descrever de forma honesta como o site funciona. Ela não é um parecer jurídico e não atesta conformidade com nenhuma lei. Para exercer os direitos acima, ou para tirar uma dúvida sobre esta política, escreva para togurumi@gmail.com e responderemos assim que for razoavelmente possível.',
      ],
    },
    {
      id: 'updates',
      title: '10. Alterações nesta política',
      paragraphs: [
        'Quando o site mudar de um jeito que afete esta descrição — um recurso novo ou um serviço externo novo —, esta página é atualizada e a data no topo muda junto. Versões anteriores não ficam disponíveis on-line, então vale reler esta página sempre que essa data tiver mudado.',
      ],
    },
  ],
}

const esES: PrivacyContent = {
  title: 'Política de privacidad',
  lastUpdated: 'Última actualización: 6 de agosto de 2026',
  intro:
    'Togurumi es un pequeño taller de crochet artesanal, con portafolio, diario y catálogo de la tienda. Esta página describe lo que el sitio hace realmente con la información: qué se queda en tu navegador, qué llega a nuestro servidor y con qué servicios externos se comunica tu navegador al cargar una página.',
  sections: [
    {
      id: 'who',
      title: '1. Quiénes somos',
      paragraphs: [
        'Togurumi está a cargo de Bella, artista independiente de crochet con sede en Brasil, quien decide cómo se tratan las informaciones descritas en esta página.',
        'Para cualquier asunto de privacidad — una duda, una corrección o una solicitud de eliminación — escribe a togurumi@gmail.com.',
      ],
    },
    {
      id: 'browser-data',
      title: '2. Información guardada en tu navegador',
      paragraphs: [
        'Tu preferencia de visualización (día, noche o seguir el sistema) y tu elección de idioma (español, inglés o portugués) se guardan en tu navegador para que el sitio se vea igual en tu próxima visita.',
        'Tu bolsa también se guarda en tu navegador. Las piezas y los colores que añades permanecen en tu dispositivo: el sitio no tiene pago en línea y no envía el contenido de tu bolsa ni a nosotros ni a terceros.',
        'Mientras alguien del equipo, ya autenticado, edita los textos de una página, el borrador sin guardar se copia en el navegador de esa persona para que sobreviva a una recarga. Esto nunca ocurre con las visitas, y la copia se descarta cuando el borrador se guarda o se cancela.',
        'Ninguna de estas informaciones del navegador se transmite hacia nosotros. Puedes consultarlas o borrarlas cuando quieras, limpiando los datos de este sitio en la configuración de tu navegador.',
      ],
    },
    {
      id: 'reviews',
      title: '3. Reseñas que decides enviar',
      paragraphs: [
        'El formulario de reseñas pide un nombre visible, una puntuación del uno al cinco y un comentario. Al enviarlo, ese nombre, la puntuación, el comentario y el momento del envío se almacenan en nuestro servidor y se publican en el sitio, donde cualquier persona puede leerlos.',
        'Usa solo un nombre que te resulte cómodo mostrar en público y evita incluir direcciones, teléfonos u otros datos personales en el comentario.',
        'Para limitar el spam, el servidor recuerda brevemente la dirección de red del envío más reciente, de modo que la misma dirección no pueda publicar más de una vez por minuto. Esa comprobación se mantiene solo en memoria, nunca se guarda junto a tu reseña y se pierde cuando el servidor se reinicia.',
        'Una reseña publicada permanece en línea hasta que el equipo de Togurumi la elimine. Puedes pedir que se retire la tuya escribiendo a togurumi@gmail.com e indicando cuál es.',
      ],
    },
    {
      id: 'team-area',
      title: '4. El área del equipo',
      paragraphs: [
        'El sitio no tiene cuentas para visitantes. Navegar, buscar, leer el diario y usar la bolsa nunca requieren iniciar sesión. La página de acceso existe solo para Bella y para las personas que la ayudan a gestionar el sitio.',
        'Una cuenta del equipo guarda un nombre de usuario, un nombre visible, un correo electrónico opcional y el nivel de permisos de esa cuenta. Las contraseñas se almacenan únicamente en una forma protegida que no puede volver a leerse, y no se muestran a nadie, tampoco a nosotros.',
        'Los intentos de acceso fallidos se cuentan en la memoria del servidor y, tras varios fallos, se rechazan durante un tiempo breve los nuevos intentos del mismo origen. Esos contadores existen solo en memoria y se borran cuando el servidor se reinicia.',
        'La página de acceso muestra un botón de inicio de sesión con Google que está desactivado y marcado como próximamente. No puede usarse y no se intercambia ninguna información con Google a través de él.',
      ],
    },
    {
      id: 'cookies',
      title: '5. Cookies',
      paragraphs: [
        'El sitio establece una única cookie, y solo después de que alguien del equipo inicia sesión. Contiene un identificador de sesión, solo puede leerla nuestro servidor, no se comparte con otros sitios y dura hasta treinta días, renovados mientras la sesión sigue en uso. Al cerrar sesión se elimina.',
        'Mientras una sesión del equipo está abierta, permanece vinculada al navegador en el que se inició. Si eso cambia, la sesión se cierra y hace falta iniciar sesión de nuevo.',
        'No hay cookies de publicidad, cookies de analítica ni rastreadores de terceros en este sitio. Como la única cookie es estrictamente necesaria para el área del equipo, no pedimos consentimiento de cookies a las visitas.',
      ],
    },
    {
      id: 'outside-services',
      title: '6. Servicios externos',
      paragraphs: [
        'El sitio carga sus tipografías desde Google Fonts. Cargar una fuente significa que tu navegador se conecta a los servidores de Google, que reciben los datos técnicos presentes en cualquier petición web, como tu dirección de red y la versión de tu navegador.',
        'Las fotos de los productos se almacenan y se entregan mediante ImageKit, así que abrir una página de la tienda conecta tu navegador a los servidores de ImageKit de la misma manera.',
        'Nuestro servidor lee el catálogo de la tienda desde una hoja de cálculo privada de Google que pertenece a Togurumi. Esa petición parte del servidor, no lleva ninguna información de las visitas, y la hoja contiene solo datos de productos.',
        'Los enlaces a Instagram y YouTube abren esas plataformas en una pestaña nueva, y no incrustamos nada de ellas en nuestras páginas. Al seguir uno de esos enlaces, pasa a aplicarse la política de privacidad de la propia plataforma. Escribir a nuestro correo significa que el mensaje lo gestiona ese proveedor de correo.',
        'No usamos analítica, redes publicitarias ni seguimiento del comportamiento de ningún tipo.',
      ],
    },
    {
      id: 'retention',
      title: '7. Cuánto tiempo se conserva la información',
      paragraphs: [
        'Las preferencias y el contenido de la bolsa permanecen en tu navegador hasta que los borres. La cookie de sesión del equipo dura hasta treinta días desde su último uso. Una reseña publicada permanece hasta que se elimine. Los registros de las cuentas del equipo permanecen mientras esa persona ayude a gestionar el sitio.',
        'Más allá de estos casos, el sitio no define plazos fijos de conservación, y la aplicación en sí no mantiene registros de acceso. Los servicios usados para alojar y entregar el sitio pueden mantener registros técnicos según sus propias políticas.',
      ],
    },
    {
      id: 'choices',
      title: '8. Tus opciones',
      paragraphs: [
        'Puedes usar todo el sitio sin enviarnos nada. Las preferencias y la bolsa nunca salen de tu dispositivo, y el formulario de reseñas es totalmente opcional.',
        'Puedes borrar las preferencias y la bolsa guardadas en cualquier momento desde la configuración de tu navegador. Bloquear las peticiones a terceros en el navegador también detiene los servicios de fuentes e imágenes descritos arriba, aunque partes de la página pueden verse distintas.',
        'Si prefieres no publicar una reseña, puedes escribir a togurumi@gmail.com.',
      ],
    },
    {
      id: 'rights',
      title: '9. Derechos y cómo contactarnos',
      paragraphs: [
        'La Ley General de Protección de Datos de Brasil (LGPD, Ley n.º 13.709/2018) reconoce derechos sobre los datos personales que te conciernen, incluidos la confirmación de que existe tratamiento, el acceso a esos datos, la corrección de lo que sea inexacto y la eliminación cuando corresponda.',
        'Esta página está escrita para describir con honestidad cómo funciona el sitio. No es un dictamen jurídico y no certifica el cumplimiento de ninguna ley. Para ejercer los derechos anteriores, o para preguntar algo sobre esta política, escribe a togurumi@gmail.com y responderemos tan pronto como razonablemente podamos.',
      ],
    },
    {
      id: 'updates',
      title: '10. Cambios en esta política',
      paragraphs: [
        'Cuando el sitio cambie de una forma que afecte a esta descripción — una función nueva o un servicio externo nuevo —, esta página se actualiza y la fecha de arriba cambia con ella. Las versiones anteriores no se mantienen en línea, así que conviene releer esta página cada vez que esa fecha haya cambiado.',
      ],
    },
  ],
}

export function getPrivacyContent(locale: SupportedLocale): PrivacyContent {
  if (locale === 'pt-BR') return ptBR
  if (locale === 'es-ES') return esES
  return enUS
}
