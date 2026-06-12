import type { SupportedLocale } from '../lib/i18n'

export type GalleryItem = {
  icon: string
  name: string
  tag: string
}

export type Messages = {
  meta: { title: string }
  nav: {
    home: string
    gallery: string
    patterns: string
    journal: string
    about: string
    contact: string
    privacy: string
  }
  theme: { system: string; day: string; night: string; menuLabel: string }
  locale: { system: string; enUS: string; ptBR: string; menuLabel: string }
  footer: { tagline: string }
  home: {
    eyebrow: string
    title: string
    intro: string
    galleryCta: string
    journalCta: string
    recentHeading: string
    viewAll: string
    journalHeading: string
    allEntries: string
    featured: GalleryItem[]
  }
  gallery: {
    eyebrow: string
    title: string
    intro: string
    items: GalleryItem[]
  }
  patterns: {
    eyebrow: string
    title: string
    intro: string
    items: { name: string; status: string; description: string }[]
  }
  journal: {
    eyebrow: string
    title: string
    intro: string
    backLink: string
  }
  about: {
    eyebrow: string
    title: string
    intro: string
    whyHeading: string
    whyBody: string
    nameHeading: string
    nameBody: string
  }
  contact: {
    eyebrow: string
    title: string
    intro: string
    instagram: string
    commissions: string
    commissionsBody: string
  }
  notFound: {
    eyebrow: string
    title: string
    body: string
    button: string
  }
}

const enUS: Messages = {
  meta: { title: 'Togurumi' },
  nav: {
    home: 'Home',
    gallery: 'Gallery',
    patterns: 'Patterns',
    journal: 'Journal',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy',
  },
  theme: { system: 'System', day: 'Day', night: 'Night', menuLabel: 'Theme' },
  locale: { system: 'System', enUS: 'English', ptBR: 'Portuguese (Brazil)', menuLabel: 'Language' },
  footer: { tagline: 'made with a hook and a lot of yarn' },
  home: {
    eyebrow: 'Togurumi',
    title: 'Small stitches, soft stories.',
    intro:
      "Handmade amigurumi and crochet notes from Bella's hook — finished friends, works-in-progress, and the quiet craft in between.",
    galleryCta: 'See the gallery',
    journalCta: 'Read the journal',
    recentHeading: 'Recently finished',
    viewAll: 'View all →',
    journalHeading: 'From the journal',
    allEntries: 'All entries →',
    featured: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Cotton yarn · 6 legs (so far)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Sage mint · button eyes' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Dusty rose · floppy ears' },
    ],
  },
  gallery: {
    eyebrow: 'Gallery',
    title: 'Finished friends & works in progress',
    intro:
      'A growing collection of amigurumi — hero shots, detail close-ups, and a few still-in-progress projects. Real photos coming soon!',
    items: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Cotton yarn · 6 legs (so far)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Sage mint · button eyes' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Dusty rose · floppy ears' },
      { icon: '🐢', name: 'Shelly the Turtle', tag: 'Honey wheat shell' },
      { icon: '🦊', name: 'Fennec Fox', tag: 'WIP — ears in progress' },
      { icon: '🐝', name: 'Bumble', tag: 'Tiny bee, big personality' },
      { icon: '🌵', name: 'Pip the Cactus', tag: 'No spikes, all hugs' },
      { icon: '🐱', name: 'Yarn Cat', tag: 'Custom commission' },
    ],
  },
  patterns: {
    eyebrow: 'Patterns',
    title: 'Patterns & commissions',
    intro:
      "Free and paid patterns will live here, along with links to Ravelry, Etsy, or PDF downloads as they're ready. For now, here's what's in the works.",
    items: [
      {
        name: 'Mochi Bear',
        status: 'Coming soon',
        description: 'A round, huggable bear with stubby arms — beginner friendly.',
      },
      {
        name: 'Clover the Bunny',
        status: 'Coming soon',
        description: 'Floppy-eared bunny with an optional dress. Intermediate.',
      },
      {
        name: 'Ollie the Octopus',
        status: 'In testing',
        description: 'Curly tentacles using a simple repeating stitch pattern.',
      },
      {
        name: 'Custom commissions',
        status: 'Open',
        description: 'Have a character in mind? Reach out via the contact page.',
      },
    ],
  },
  journal: {
    eyebrow: 'Journal',
    title: 'Notes from the hook',
    intro: 'Process posts — works in progress, yarn picks, mistakes, and small wins.',
    backLink: '← Back to journal',
  },
  about: {
    eyebrow: 'About',
    title: "Hi, I'm Bella",
    intro:
      'I make amigurumi — small crocheted creatures, mostly animals, occasionally something stranger. "Togurumi" is where I keep track of what I\'m making, what I\'ve learned, and what\'s next on the hook.',
    whyHeading: 'Why amigurumi?',
    whyBody:
      "There's something satisfying about turning a single strand of yarn into a little character with its own personality — and about the slow, repetitive rhythm of single crochet rounds. This site is a place to share that process: the finished pieces, the in-progress mess, and the patterns I'm working on.",
    nameHeading: 'What "Togurumi" means',
    nameBody:
      'A little portmanteau of my own — part nickname, part "amigurumi." This is my corner for it: gallery, journal, and (eventually) patterns to download or commission.',
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Say hello',
    intro: 'Questions about a piece, interested in a commission, or just want to chat about yarn? Reach out.',
    instagram: 'Instagram',
    commissions: 'Commissions',
    commissionsBody: 'Custom characters welcome — send a message with your idea and any reference photos.',
  },
  notFound: {
    eyebrow: '404',
    title: "This stitch doesn't exist",
    body: "The page you're looking for has unraveled. Let's get you back on track.",
    button: 'Back home',
  },
}

const ptBR: Messages = {
  meta: { title: 'Togurumi' },
  nav: {
    home: 'Início',
    gallery: 'Galeria',
    patterns: 'Moldes',
    journal: 'Diário',
    about: 'Sobre',
    contact: 'Contato',
    privacy: 'Privacidade',
  },
  theme: { system: 'Sistema', day: 'Dia', night: 'Noite', menuLabel: 'Tema' },
  locale: { system: 'Sistema', enUS: 'Inglês', ptBR: 'Português (Brasil)', menuLabel: 'Idioma' },
  footer: { tagline: 'feito com uma agulha e muito fio' },
  home: {
    eyebrow: 'Togurumi',
    title: 'Pontinhos pequenos, histórias macias.',
    intro:
      'Amigurumis feitos à mão e anotações de crochê da agulha da Bella — amiguinhos prontos, trabalhos em andamento e o artesanato tranquilo no meio do caminho.',
    galleryCta: 'Ver a galeria',
    journalCta: 'Ler o diário',
    recentHeading: 'Recém-finalizados',
    viewAll: 'Ver tudo →',
    journalHeading: 'Do diário',
    allEntries: 'Todas as entradas →',
    featured: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Fio de algodão · 6 pernas (por enquanto)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Verde-sálvia · olhos de botão' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Rosa empoeirado · orelhas caídas' },
    ],
  },
  gallery: {
    eyebrow: 'Galeria',
    title: 'Amiguinhos prontos e trabalhos em andamento',
    intro:
      'Uma coleção crescente de amigurumis — fotos de destaque, detalhes em close e alguns projetos ainda em progresso. Fotos reais em breve!',
    items: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Fio de algodão · 6 pernas (por enquanto)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Verde-sálvia · olhos de botão' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Rosa empoeirado · orelhas caídas' },
      { icon: '🐢', name: 'Shelly the Turtle', tag: 'Concha trigo-mel' },
      { icon: '🦊', name: 'Fennec Fox', tag: 'WIP — orelhas em andamento' },
      { icon: '🐝', name: 'Bumble', tag: 'Abelhinha pequena, personalidade grande' },
      { icon: '🌵', name: 'Pip the Cactus', tag: 'Sem espinhos, só abraços' },
      { icon: '🐱', name: 'Yarn Cat', tag: 'Encomenda personalizada' },
    ],
  },
  patterns: {
    eyebrow: 'Moldes',
    title: 'Moldes e encomendas',
    intro:
      'Moldes gratuitos e pagos vão morar aqui, junto com links para Ravelry, Etsy ou downloads em PDF conforme forem ficando prontos. Por enquanto, eis o que está em andamento.',
    items: [
      {
        name: 'Mochi Bear',
        status: 'Em breve',
        description: 'Um urso redondo e abraçável com bracinhos curtos — indicado para iniciantes.',
      },
      {
        name: 'Clover the Bunny',
        status: 'Em breve',
        description: 'Coelhinha de orelhas caídas com vestido opcional. Intermediário.',
      },
      {
        name: 'Ollie the Octopus',
        status: 'Em teste',
        description: 'Tentáculos cacheados usando um padrão de ponto repetitivo simples.',
      },
      {
        name: 'Encomendas personalizadas',
        status: 'Aberto',
        description: 'Tem um personagem em mente? Entre em contato pela página de contato.',
      },
    ],
  },
  journal: {
    eyebrow: 'Diário',
    title: 'Anotações da agulha',
    intro: 'Posts de processo — trabalhos em andamento, escolhas de fio, erros e pequenas vitórias.',
    backLink: '← Voltar ao diário',
  },
  about: {
    eyebrow: 'Sobre',
    title: 'Oi, eu sou a Bella',
    intro:
      'Eu faço amigurumi — bichinhos pequenos de crochê, na maioria animais, às vezes algo mais estranho. "Togurumi" é onde guardo o que estou fazendo, o que aprendi e o que vem a seguir na agulha.',
    whyHeading: 'Por que amigurumi?',
    whyBody:
      'Tem algo satisfatório em transformar um fio só num personagem com personalidade própria — e no ritmo lento e repetitivo das carreiras de ponto baixo. Este site é um lugar para compartilhar esse processo: as peças prontas, a bagunça em andamento e os moldes em que estou trabalhando.',
    nameHeading: 'O que "Togurumi" significa',
    nameBody:
      'Um pequeno portmanteau meu — parte apelido, parte "amigurumi". É o meu cantinho para isso: galeria, diário e (eventualmente) moldes para baixar ou encomendar.',
  },
  contact: {
    eyebrow: 'Contato',
    title: 'Diga oi',
    intro: 'Dúvidas sobre uma peça, interesse em encomenda ou só quer bater papo sobre fio? Manda mensagem.',
    instagram: 'Instagram',
    commissions: 'Encomendas',
    commissionsBody: 'Personagens personalizados são bem-vindos — envie uma mensagem com sua ideia e fotos de referência, se tiver.',
  },
  notFound: {
    eyebrow: '404',
    title: 'Este ponto não existe',
    body: 'A página que você procura se desfiou. Vamos te colocar de volta no caminho.',
    button: 'Voltar ao início',
  },
}

export function getMessages(locale: SupportedLocale): Messages {
  return locale === 'pt-BR' ? ptBR : enUS
}
