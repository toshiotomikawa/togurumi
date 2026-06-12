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
  lastUpdated: 'Last updated: June 11, 2026',
  intro:
    'Togurumi ("we", "our", or "the site") is a personal portfolio and blog showcasing amigurumi and crochet work. This policy explains how we handle information when you visit, and is written to meet the baseline disclosure requirements of Brazil\'s Lei Geral de Proteção de Dados (LGPD — Law No. 13,709/2018).',
  sections: [
    {
      id: 'who',
      title: '1. Who we are',
      paragraphs: [
        'Togurumi is operated by Bella, an independent crochet artist based in Brazil. For any privacy-related questions, contact privacy@togurumi.example.',
      ],
    },
    {
      id: 'data',
      title: '2. Data we store',
      paragraphs: [
        "This site has no backend, no accounts, and no forms. The only information stored is your theme preference (day, night, or system) and language preference (English or Portuguese), saved locally in your browser's localStorage.",
        'This data never leaves your device, is not transmitted to us or anyone else, and is used solely to remember your display settings between visits.',
      ],
    },
    {
      id: 'cookies',
      title: '3. Cookies & tracking',
      paragraphs: [
        'We do not use cookies, analytics tools, advertising networks, or any third-party trackers.',
      ],
    },
    {
      id: 'rights',
      title: '4. Your rights under LGPD',
      paragraphs: [
        "Under Brazil's General Data Protection Law (LGPD), you have the right to access, correct, or delete personal data we hold about you. Since the only data stored is your local browser preferences — which never reach our servers — you can view or delete it at any time by clearing your browser's site data or local storage. We do not retain any copy of this information.",
      ],
    },
    {
      id: 'contact',
      title: '5. Contact',
      paragraphs: [
        'The Contact page links to our Instagram profile (instagram.com/togurumi) for general inquiries. For privacy questions or requests under LGPD, email privacy@togurumi.example.',
      ],
    },
  ],
}

const ptBR: PrivacyContent = {
  title: 'Política de Privacidade',
  lastUpdated: 'Última atualização: 11 de junho de 2026',
  intro:
    'O Togurumi ("nós" ou "o site") é um portfólio pessoal e blog dedicado a trabalhos de amigurumi e crochê. Esta política explica como tratamos as informações quando você visita o site, e foi escrita para atender aos requisitos básicos de divulgação da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
  sections: [
    {
      id: 'who',
      title: '1. Quem somos',
      paragraphs: [
        'O Togurumi é mantido por Bella, artesã de crochê independente, sediada no Brasil. Para questões relacionadas à privacidade, entre em contato pelo e-mail privacy@togurumi.example.',
      ],
    },
    {
      id: 'data',
      title: '2. Dados que armazenamos',
      paragraphs: [
        'Este site não possui backend, contas de usuário ou formulários. A única informação armazenada é a sua preferência de tema (dia, noite ou automático) e preferência de idioma (português ou inglês), salvas localmente no localStorage do seu navegador.',
        'Esses dados nunca saem do seu dispositivo, não são transmitidos para nós ou para terceiros, e servem apenas para lembrar suas configurações de exibição entre visitas.',
      ],
    },
    {
      id: 'cookies',
      title: '3. Cookies e rastreamento',
      paragraphs: [
        'Não utilizamos cookies, ferramentas de análise (analytics), redes de publicidade ou qualquer rastreador de terceiros.',
      ],
    },
    {
      id: 'rights',
      title: '4. Seus direitos sob a LGPD',
      paragraphs: [
        'De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir ou excluir dados pessoais que tratamos sobre você. Como a única informação armazenada são suas preferências locais de navegador — que nunca chegam aos nossos servidores — você pode visualizá-las ou excluí-las a qualquer momento limpando os dados do site ou o armazenamento local do navegador. Não mantemos nenhuma cópia dessas informações.',
      ],
    },
    {
      id: 'contact',
      title: '5. Contato',
      paragraphs: [
        'A página de Contato traz um link para nosso perfil no Instagram (instagram.com/togurumi) para dúvidas gerais. Para questões de privacidade ou solicitações com base na LGPD, envie um e-mail para privacy@togurumi.example.',
      ],
    },
  ],
}

export function getPrivacyContent(locale: SupportedLocale): PrivacyContent {
  return locale === 'pt-BR' ? ptBR : enUS
}
