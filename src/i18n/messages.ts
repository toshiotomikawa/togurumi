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
  locale: { system: string; enUS: string; ptBR: string; esES: string; menuLabel: string }
  auth: {
    loginTitle: string
    loginIntro: string
    username: string
    password: string
    submit: string
    invalidCredentials: string
    tooManyAttempts: string
    genericError: string
    or: string
    googleButton: string
    comingSoon: string
    loginNav: string
    logout: string
    adminNav: string
    journalEditorNav: string
    loggedInAs: string
    adminWelcome: string
    adminJournalCardTitle: string
    adminJournalCardBody: string
    editorTitle: string
    newPost: string
    editPost: string
    deletePost: string
    deleteConfirm: string
    fieldSlug: string
    fieldLocale: string
    fieldTitle: string
    fieldDate: string
    fieldOrder: string
    fieldSummary: string
    fieldBody: string
    save: string
    cancel: string
    saveSuccess: string
    saveError: string
    deleteSuccess: string
    accountNav: string
    accountTitle: string
    accountIntro: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
    passwordMismatch: string
    changePassword: string
    passwordUpdated: string
    wrongPassword: string
    weakPassword: string
    email: string
    emailOptional: string
    emailHint: string
    invalidEmail: string
    saveProfile: string
    profileUpdated: string
    showPassword: string
    hidePassword: string
  }
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
  locale: { system: 'System', enUS: 'English', ptBR: 'Portuguese (Brazil)', esES: 'Spanish', menuLabel: 'Language' },
  auth: {
    loginTitle: 'Sign in',
    loginIntro: 'Access the private Togurumi tools for managing journal posts.',
    username: 'Username',
    password: 'Password',
    submit: 'Sign in',
    invalidCredentials: 'The username or password is incorrect.',
    tooManyAttempts: 'Too many attempts. Please wait a bit before trying again.',
    genericError: 'Something went wrong. Please try again.',
    or: 'or',
    googleButton: 'Sign in with Google',
    comingSoon: 'Coming soon',
    loginNav: 'Login',
    logout: 'Logout',
    adminNav: 'Admin',
    journalEditorNav: 'Manage posts',
    loggedInAs: 'Signed in as',
    adminWelcome: 'Welcome back',
    adminJournalCardTitle: 'Journal editor',
    adminJournalCardBody: 'Create, edit, translate, and remove Togurumi journal posts.',
    editorTitle: 'Journal editor',
    newPost: 'New post',
    editPost: 'Edit post',
    deletePost: 'Delete',
    deleteConfirm: 'Delete this journal post? This cannot be undone.',
    fieldSlug: 'Slug',
    fieldLocale: 'Locale',
    fieldTitle: 'Title',
    fieldDate: 'Date',
    fieldOrder: 'Order',
    fieldSummary: 'Summary',
    fieldBody: 'Body',
    save: 'Save',
    cancel: 'Cancel',
    saveSuccess: 'Post saved.',
    saveError: 'Could not save the post.',
    deleteSuccess: 'Post deleted.',
    accountNav: 'Account settings',
    accountTitle: 'Account settings',
    accountIntro: 'Update your password and contact details.',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordMismatch: 'The new passwords do not match.',
    changePassword: 'Update password',
    passwordUpdated: 'Password updated.',
    wrongPassword: 'The current password is incorrect.',
    weakPassword: 'Use at least 8 characters.',
    email: 'Email',
    emailOptional: 'Email (optional)',
    emailHint: "Optional for now — required for standard accounts once self sign-up is available.",
    invalidEmail: 'Enter a valid email address.',
    saveProfile: 'Save',
    profileUpdated: 'Profile updated.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
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
    patterns: 'Receitas',
    journal: 'Diário',
    about: 'Sobre',
    contact: 'Contato',
    privacy: 'Privacidade',
  },
  theme: { system: 'Sistema', day: 'Dia', night: 'Noite', menuLabel: 'Tema' },
  locale: { system: 'Sistema', enUS: 'Inglês', ptBR: 'Português (Brasil)', esES: 'Espanhol', menuLabel: 'Idioma' },
  auth: {
    loginTitle: 'Entrar',
    loginIntro: 'Acesse as ferramentas privadas da Togurumi para gerenciar posts do diário.',
    username: 'Usuário',
    password: 'Senha',
    submit: 'Entrar',
    invalidCredentials: 'O usuário ou a senha está incorreto.',
    tooManyAttempts: 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.',
    genericError: 'Algo deu errado. Tente novamente.',
    or: 'ou',
    googleButton: 'Entrar com Google',
    comingSoon: 'Em breve',
    loginNav: 'Entrar',
    logout: 'Sair',
    adminNav: 'Admin',
    journalEditorNav: 'Gerenciar posts',
    loggedInAs: 'Conectado como',
    adminWelcome: 'Boas-vindas de volta',
    adminJournalCardTitle: 'Editor do diário',
    adminJournalCardBody: 'Crie, edite, traduza e remova posts do diário da Togurumi.',
    editorTitle: 'Editor do diário',
    newPost: 'Novo post',
    editPost: 'Editar post',
    deletePost: 'Excluir',
    deleteConfirm: 'Excluir este post do diário? Isso não pode ser desfeito.',
    fieldSlug: 'Slug',
    fieldLocale: 'Idioma',
    fieldTitle: 'Título',
    fieldDate: 'Data',
    fieldOrder: 'Ordem',
    fieldSummary: 'Resumo',
    fieldBody: 'Corpo',
    save: 'Salvar',
    cancel: 'Cancelar',
    saveSuccess: 'Post salvo.',
    saveError: 'Não foi possível salvar o post.',
    deleteSuccess: 'Post excluído.',
    accountNav: 'Configurações da conta',
    accountTitle: 'Configurações da conta',
    accountIntro: 'Atualize sua senha e seus dados de contato.',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirmar nova senha',
    passwordMismatch: 'As novas senhas não coincidem.',
    changePassword: 'Atualizar senha',
    passwordUpdated: 'Senha atualizada.',
    wrongPassword: 'A senha atual está incorreta.',
    weakPassword: 'Use pelo menos 8 caracteres.',
    email: 'E-mail',
    emailOptional: 'E-mail (opcional)',
    emailHint: 'Opcional por enquanto — será obrigatório para contas padrão quando o cadastro próprio estiver disponível.',
    invalidEmail: 'Informe um e-mail válido.',
    saveProfile: 'Salvar',
    profileUpdated: 'Perfil atualizado.',
    showPassword: 'Mostrar senha',
    hidePassword: 'Ocultar senha',
  },
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
    eyebrow: 'Receitas',
    title: 'Receitas e encomendas',
    intro:
      'Receitas gratuitas e pagas vão morar aqui, junto com links para Ravelry, Etsy ou downloads em PDF conforme forem ficando prontos. Por enquanto, eis o que está em andamento.',
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

const esES: Messages = {
  meta: { title: 'Togurumi' },
  nav: {
    home: 'Inicio',
    gallery: 'Galería',
    patterns: 'Patrones',
    journal: 'Diario',
    about: 'Acerca de',
    contact: 'Contacto',
    privacy: 'Privacidad',
  },
  theme: { system: 'Sistema', day: 'Día', night: 'Noche', menuLabel: 'Tema' },
  locale: { system: 'Sistema', enUS: 'Inglés', ptBR: 'Portugués (Brasil)', esES: 'Español', menuLabel: 'Idioma' },
  auth: {
    loginTitle: 'Iniciar sesión',
    loginIntro: 'Accede a las herramientas privadas de Togurumi para gestionar las publicaciones del diario.',
    username: 'Usuario',
    password: 'Contraseña',
    submit: 'Entrar',
    invalidCredentials: 'El usuario o la contraseña no son correctos.',
    tooManyAttempts: 'Demasiados intentos. Espera un poco antes de volver a probar.',
    genericError: 'Algo salió mal. Inténtalo de nuevo.',
    or: 'o',
    googleButton: 'Iniciar sesión con Google',
    comingSoon: 'Próximamente',
    loginNav: 'Entrar',
    logout: 'Cerrar sesión',
    adminNav: 'Admin',
    journalEditorNav: 'Gestionar posts',
    loggedInAs: 'Sesión iniciada como',
    adminWelcome: 'Bienvenida de vuelta',
    adminJournalCardTitle: 'Editor del diario',
    adminJournalCardBody: 'Crea, edita, traduce y elimina publicaciones del diario de Togurumi.',
    editorTitle: 'Editor del diario',
    newPost: 'Nuevo post',
    editPost: 'Editar post',
    deletePost: 'Eliminar',
    deleteConfirm: '¿Eliminar esta publicación del diario? Esta acción no se puede deshacer.',
    fieldSlug: 'Slug',
    fieldLocale: 'Idioma',
    fieldTitle: 'Título',
    fieldDate: 'Fecha',
    fieldOrder: 'Orden',
    fieldSummary: 'Resumen',
    fieldBody: 'Contenido',
    save: 'Guardar',
    cancel: 'Cancelar',
    saveSuccess: 'Post guardado.',
    saveError: 'No se pudo guardar el post.',
    deleteSuccess: 'Post eliminado.',
    accountNav: 'Configuración de cuenta',
    accountTitle: 'Configuración de cuenta',
    accountIntro: 'Actualiza tu contraseña y tus datos de contacto.',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
    passwordMismatch: 'Las nuevas contraseñas no coinciden.',
    changePassword: 'Actualizar contraseña',
    passwordUpdated: 'Contraseña actualizada.',
    wrongPassword: 'La contraseña actual es incorrecta.',
    weakPassword: 'Usa al menos 8 caracteres.',
    email: 'Correo electrónico',
    emailOptional: 'Correo electrónico (opcional)',
    emailHint: 'Opcional por ahora — será obligatorio para cuentas estándar cuando el registro propio esté disponible.',
    invalidEmail: 'Ingresa un correo electrónico válido.',
    saveProfile: 'Guardar',
    profileUpdated: 'Perfil actualizado.',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },
  footer: { tagline: 'hecho con una aguja y mucho hilo' },
  home: {
    eyebrow: 'Togurumi',
    title: 'Puntadas pequeñas, historias suaves.',
    intro:
      'Amigurumis hechos a mano y notas de crochet del gancho de Bella — amiguitos terminados, trabajos en progreso y el oficio tranquilo entre medio.',
    galleryCta: 'Ver la galería',
    journalCta: 'Leer el diario',
    recentHeading: 'Recién terminados',
    viewAll: 'Ver todo →',
    journalHeading: 'Del diario',
    allEntries: 'Todas las entradas →',
    featured: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Hilo de algodón · 6 patas (por ahora)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Verde salvia · ojos de botón' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Rosa empolvado · orejas caídas' },
    ],
  },
  gallery: {
    eyebrow: 'Galería',
    title: 'Amiguitos terminados y trabajos en progreso',
    intro:
      'Una colección creciente de amigurumis — fotos destacadas, primeros planos de detalles y algunos proyectos aún en progreso. ¡Pronto fotos reales!',
    items: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Hilo de algodón · 6 patas (por ahora)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Verde salvia · ojos de botón' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Rosa empolvado · orejas caídas' },
      { icon: '🐢', name: 'Shelly the Turtle', tag: 'Caparazón color miel' },
      { icon: '🦊', name: 'Fennec Fox', tag: 'En progreso — orejas en proceso' },
      { icon: '🐝', name: 'Bumble', tag: 'Abejita pequeña, gran personalidad' },
      { icon: '🌵', name: 'Pip the Cactus', tag: 'Sin espinas, solo abrazos' },
      { icon: '🐱', name: 'Yarn Cat', tag: 'Encargo personalizado' },
    ],
  },
  patterns: {
    eyebrow: 'Patrones',
    title: 'Patrones y encargos',
    intro:
      'Aquí vivirán patrones gratuitos y de pago, junto con enlaces a Ravelry, Etsy o descargas en PDF cuando estén listos. Por ahora, esto es lo que está en marcha.',
    items: [
      {
        name: 'Mochi Bear',
        status: 'Próximamente',
        description: 'Un oso redondo y abrazable con brazos cortitos — apto para principiantes.',
      },
      {
        name: 'Clover the Bunny',
        status: 'Próximamente',
        description: 'Conejita de orejas caídas con vestido opcional. Nivel intermedio.',
      },
      {
        name: 'Ollie the Octopus',
        status: 'En pruebas',
        description: 'Tentáculos rizados usando un patrón de puntada repetitivo simple.',
      },
      {
        name: 'Encargos personalizados',
        status: 'Abierto',
        description: '¿Tienes un personaje en mente? Contáctame desde la página de contacto.',
      },
    ],
  },
  journal: {
    eyebrow: 'Diario',
    title: 'Notas desde el gancho',
    intro: 'Publicaciones de proceso — trabajos en progreso, elecciones de hilo, errores y pequeños logros.',
    backLink: '← Volver al diario',
  },
  about: {
    eyebrow: 'Acerca de',
    title: 'Hola, soy Bella',
    intro:
      'Hago amigurumis — pequeñas criaturas tejidas a crochet, sobre todo animales, a veces algo más extraño. "Togurumi" es donde guardo registro de lo que estoy haciendo, lo que he aprendido y lo que viene a continuación en el gancho.',
    whyHeading: '¿Por qué amigurumi?',
    whyBody:
      'Hay algo satisfactorio en convertir un solo hilo de lana en un pequeño personaje con personalidad propia — y en el ritmo lento y repetitivo de las vueltas de punto bajo. Este sitio es un lugar para compartir ese proceso: las piezas terminadas, el desorden en progreso y los patrones en los que estoy trabajando.',
    nameHeading: 'Qué significa "Togurumi"',
    nameBody:
      'Un pequeño acrónimo propio — parte apodo, parte "amigurumi". Este es mi rincón para ello: galería, diario y (eventualmente) patrones para descargar o encargar.',
  },
  contact: {
    eyebrow: 'Contacto',
    title: 'Saluda',
    intro: '¿Preguntas sobre una pieza, interesado en un encargo, o solo quieres charlar sobre hilos? Escríbeme.',
    instagram: 'Instagram',
    commissions: 'Encargos',
    commissionsBody: 'Personajes personalizados son bienvenidos — envía un mensaje con tu idea y fotos de referencia, si tienes.',
  },
  notFound: {
    eyebrow: '404',
    title: 'Esta puntada no existe',
    body: 'La página que buscas se ha deshilado. Vamos a regresarte al buen camino.',
    button: 'Volver al inicio',
  },
}

export function getMessages(locale: SupportedLocale): Messages {
  if (locale === 'pt-BR') return ptBR
  if (locale === 'es-ES') return esES
  return enUS
}
