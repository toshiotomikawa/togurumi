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
    shop: string
    journal: string
    faq: string
    contact: string
    privacy: string
    menuLabel: string
    menuCloseLabel: string
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
    adminImagesCardTitle: string
    adminImagesCardBody: string
    imagesTitle: string
    imagesIntro: string
    imagesProductLabel: string
    imagesColorLabel: string
    imagesDefaultColor: string
    imagesColorHint: string
    imagesFileLabel: string
    imagesFileHint: string
    imagesUpload: string
    imagesUploading: string
    imagesUploadSuccess: string
    imagesUploadError: string
    imagesLoadError: string
    imagesInvalidFile: string
    imagesLoading: string
    imagesNoProducts: string
    imagesCurrent: string
    imagesNewPreview: string
    imagesNoImage: string
    editorTitle: string
    newPost: string
    editPost: string
    deletePost: string
    deleteConfirm: string
    archivePost: string
    unarchivePost: string
    archiveSuccess: string
    unarchiveSuccess: string
    archivedBadge: string
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
    accountMenuLabel: string
  }
  footer: {
    tagline: string
    note: string
    navLabel: string
    socialLabel: string
  }
  home: {
    eyebrow: string
    title: string
    intro: string
    shopCta: string
    journalCta: string
    highlightsHeading: string
    storeHeading: string
    viewAll: string
    journalHeading: string
    allEntries: string
    youtubeHeading: string
    youtubeIntro: string
    youtubeVideoCta: string
    youtubeChannelCta: string
  }
  shop: {
    eyebrow: string
    title: string
    intro: string
    availableHeading: string
    availableEmpty: string
    stockLabel: string
    outOfStock: string
    allCategories: string
    newBadge: string
    backLink: string
    yarnLabel: string
    coresLabel: string
    chooseColorLabel: string
    selectedColorLabel: string
    designerLabel: string
    photoComingSoon: string
    comingSoonTitle: string
    comingSoonBody: string
    addToCart: string
    addedToCart: string
    deliveryNotice: string
    galleryHeading: string
    galleryItems: GalleryItem[]
    patternsHeading: string
    patternsIntro: string
    commissionCta: string
    patternsItems: { name: string; status: string; description: string; action?: 'commission' }[]
  }
  journal: {
    eyebrow: string
    title: string
    intro: string
    backLink: string
    byAuthor: string
  }
  about: {
    eyebrow: string
    title: string
    intro: string
    storyHeading: string
    storyBody: string
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
    youtube: string
    email: string
    commissions: string
    commissionsBody: string
  }
  notFound: {
    eyebrow: string
    title: string
    body: string
    button: string
  }
  search: {
    ariaLabel: string
    eyebrow: string
    title: string
    placeholder: string
    noResults: string
    filteringBy: string
    clearFilter: string
  }
  cart: {
    ariaLabel: string
    eyebrow: string
    title: string
    empty: string
    remove: string
    total: string
    continueShopping: string
    checkoutNote: string
  }
  reviews: {
    eyebrow: string
    title: string
    intro: string
    formHeading: string
    nameLabel: string
    namePlaceholder: string
    ratingLabel: string
    commentLabel: string
    commentPlaceholder: string
    submit: string
    submitting: string
    success: string
    errorGeneric: string
    errorTooMany: string
    empty: string
    remove: string
  }
  faqEditor: {
    editButton: string
    doneButton: string
    eyebrowLabel: string
    titleLabel: string
    introLabel: string
    questionLabel: string
    answerLabel: string
    addItem: string
    removeItem: string
    reorderLabel: string
    save: string
    cancel: string
    saveSuccess: string
    saveError: string
  }
  contentEditor: {
    editButton: string
    save: string
    cancel: string
    saveSuccess: string
    saveError: string
    draftRestored: string
    fields: {
      eyebrow: string
      title: string
      intro: string
      shopCta: string
      journalCta: string
      highlightsHeading: string
      storeHeading: string
      viewAll: string
      journalHeading: string
      allEntries: string
      youtubeHeading: string
      youtubeIntro: string
      youtubeVideoCta: string
      youtubeChannelCta: string
      storyHeading: string
      storyBody: string
      whyHeading: string
      whyBody: string
      nameHeading: string
      nameBody: string
      instagram: string
      youtube: string
      email: string
      commissions: string
      commissionsBody: string
    }
  }
}

const enUS: Messages = {
  meta: { title: 'Togurumi' },
  nav: {
    home: 'Home',
    shop: 'Shop',
    journal: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    privacy: 'Privacy',
    menuLabel: 'Menu',
    menuCloseLabel: 'Close menu',
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
    adminImagesCardTitle: 'Product images',
    adminImagesCardBody: 'Upload product photos and connect them to the Google Sheets catalog.',
    imagesTitle: 'Product images',
    imagesIntro: 'Choose a catalog product and upload the photo that should appear in the shop.',
    imagesProductLabel: 'Product',
    imagesColorLabel: 'Image for',
    imagesDefaultColor: 'Main image (shop cards and fallback)',
    imagesColorHint: 'Choose a color to give that variation its own photo.',
    imagesFileLabel: 'Image',
    imagesFileHint: 'JPEG, PNG, or WebP. Maximum 8 MB.',
    imagesUpload: 'Upload image',
    imagesUploading: 'Uploading...',
    imagesUploadSuccess: 'Image uploaded and saved to the catalog.',
    imagesUploadError: 'Could not upload the image. Try again.',
    imagesLoadError: 'Could not load catalog products.',
    imagesInvalidFile: 'Choose a valid JPEG, PNG, or WebP image up to 8 MB.',
    imagesLoading: 'Loading products...',
    imagesNoProducts: 'No products found',
    imagesCurrent: 'Current image',
    imagesNewPreview: 'New image preview',
    imagesNoImage: 'No image uploaded',
    editorTitle: 'Journal editor',
    newPost: 'New post',
    editPost: 'Edit post',
    deletePost: 'Delete',
    deleteConfirm: 'Delete this journal post? This cannot be undone.',
    archivePost: 'Archive',
    unarchivePost: 'Unarchive',
    archiveSuccess: 'Post archived.',
    unarchiveSuccess: 'Post unarchived.',
    archivedBadge: 'Archived',
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
    emailHint: "Optional for now, but required for standard accounts once self sign-up is available.",
    invalidEmail: 'Enter a valid email address.',
    saveProfile: 'Save',
    profileUpdated: 'Profile updated.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    accountMenuLabel: 'Account',
  },
  footer: {
    tagline: 'made with a hook and a lot of yarn',
    note: 'Handmade amigurumi by Bella · orders and custom pieces via Instagram direct @togurumi',
    navLabel: 'Footer',
    socialLabel: 'Social and contact',
  },
  home: {
    eyebrow: 'トグルミ',
    title: 'Small stitches, soft stories.',
    intro:
      "Handmade amigurumi and crochet notes from Bella's hook: finished friends, works-in-progress, and the quiet craft in between.",
    shopCta: 'Visit the shop',
    journalCta: 'Read the journal',
    highlightsHeading: 'Highlights of the month',
    storeHeading: 'Available in the shop',
    viewAll: 'View all →',
    journalHeading: 'From the journal',
    allEntries: 'All entries →',
    youtubeHeading: 'Watch Togurumi on YouTube',
    youtubeIntro: 'See Bella bring yarn to life, one stitch at a time. Start with the latest Togurumi video.',
    youtubeVideoCta: 'Watch the latest video',
    youtubeChannelCta: 'Visit the channel',
  },
  shop: {
    eyebrow: 'Shop',
    title: 'Finished friends, patterns & commissions',
    intro:
      "A growing collection of amigurumi pieces, pattern plans, and commission notes: finished friends, detail close-ups, works in progress, and links as they're ready.",
    availableHeading: 'Available now',
    availableEmpty: 'New pieces are on the way, check back soon!',
    stockLabel: 'In stock',
    outOfStock: 'Sold out',
    allCategories: 'All',
    newBadge: 'NEW!',
    backLink: 'Back to shop',
    yarnLabel: 'Yarn',
    coresLabel: 'Colors',
    chooseColorLabel: 'Choose a color',
    selectedColorLabel: 'Selected color',
    designerLabel: 'Designer',
    photoComingSoon: 'Photo coming soon',
    comingSoonTitle: 'More friends coming soon!',
    comingSoonBody: 'Bella is preparing new handmade pieces. Check back soon!',
    addToCart: 'Add to cart',
    addedToCart: 'Added to cart!',
    deliveryNotice:
      'For now, delivery is available only in Curitiba and the metropolitan region. Shipping to all Brazilian states is planned for the future.',
    galleryHeading: 'Finished friends & works in progress',
    galleryItems: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Cotton yarn · 6 legs (so far)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Sage mint · button eyes' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Dusty rose · floppy ears' },
      { icon: '🐢', name: 'Shelly the Turtle', tag: 'Honey wheat shell' },
      { icon: '🦊', name: 'Fennec Fox', tag: 'WIP, ears in progress' },
      { icon: '🐝', name: 'Bumble', tag: 'Tiny bee, big personality' },
      { icon: '🌵', name: 'Pip the Cactus', tag: 'No spikes, all hugs' },
      { icon: '🐱', name: 'Yarn Cat', tag: 'Custom commission' },
    ],
    patternsHeading: 'Patterns & commissions',
    patternsIntro:
      "Free and paid patterns will live here, along with links to Ravelry, Etsy, or PDF downloads as they're ready. For now, here's what's in the works.",
    commissionCta: 'Send a private message',
    patternsItems: [
      {
        name: 'Mochi Bear',
        status: 'Coming soon',
        description: 'A round, huggable bear with stubby arms, beginner friendly.',
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
        description: 'Have a character in mind? Send a private message to @togurumi on Instagram.',
        action: 'commission',
      },
    ],
  },
  journal: {
    eyebrow: 'Journal',
    title: 'Notes from the hook',
    intro: 'Process posts: works in progress, yarn picks, mistakes, and small wins.',
    backLink: '← Back to journal',
    byAuthor: 'By {{author}}',
  },
  about: {
    eyebrow: 'About',
    title: "Hi, I'm Bella",
    intro:
      'I make amigurumi: small crocheted creatures, mostly animals, occasionally something stranger. "Togurumi" is where I keep track of what I\'m making, what I\'ve learned, and what\'s next on the hook.',
    storyHeading: 'My story',
    storyBody:
      "I learned to crochet as a child, embroidering dish towels with my great-grandmother. In 2020 I decided to explore another branch of this craft: amigurumi. I started with this art as a kind of hands-on therapy, and today it's my space for self-care.",
    whyHeading: 'Why amigurumi?',
    whyBody:
      "Turning a ball of yarn into something with its own personality, something people of any age can enjoy, feels like magic to me. Making a piece that can be a teenager's keychain, a child's toy, or a grown-up's favorite little knick-knack is what drives me to explore new shapes and colors and make your everyday a little less monotonous.",
    nameHeading: 'What "Togurumi" means',
    nameBody:
      'A little portmanteau of my own: "To" from my surname, Tomikawa (富川), and "gurumi" from "amigurumi." This is my corner for it: gallery, journal, and (eventually) patterns to download or commission.',
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Say hello',
    intro: 'Questions about a piece, interested in a commission, or just want to chat about yarn? Reach out.',
    instagram: 'Instagram',
    youtube: 'YouTube',
    email: 'Email',
    commissions: 'Commissions',
    commissionsBody:
      'Custom characters are welcome. Tap here to send a private message to @togurumi on Instagram with your idea and any reference photos.',
  },
  notFound: {
    eyebrow: '404',
    title: "This stitch doesn't exist",
    body: "The page you're looking for has unraveled. Let's get you back on track.",
    button: 'Back home',
  },
  search: {
    ariaLabel: 'Search',
    eyebrow: 'Search',
    title: 'Find a piece',
    placeholder: 'Search by name, type, yarn...',
    noResults: 'No pieces match your search.',
    filteringBy: 'Filtering by',
    clearFilter: 'Clear filter',
  },
  cart: {
    ariaLabel: 'Cart',
    eyebrow: 'Cart',
    title: 'Your cart',
    empty: "Your cart is empty. Go find something to love.",
    remove: 'Remove',
    total: 'Total',
    continueShopping: 'Continue shopping',
    checkoutNote: "Checkout isn't quite ready yet, we'll let you know as soon as it's open!",
  },
  reviews: {
    eyebrow: 'Reviews',
    title: 'What people are saying',
    intro: "Kind words from folks who've welcomed a Togurumi friend home. Got one of your own? We'd love to hear it.",
    formHeading: 'Leave a review',
    nameLabel: 'Your name',
    namePlaceholder: 'Your name',
    ratingLabel: 'Rating',
    commentLabel: 'Your review',
    commentPlaceholder: 'Tell us what you think',
    submit: 'Submit review',
    submitting: 'Sending...',
    success: 'Thanks for the kind words! Your review has been posted.',
    errorGeneric: 'Something went wrong, please try again.',
    errorTooMany: 'Please wait a moment before submitting another review.',
    empty: 'No reviews yet, be the first to share one!',
    remove: 'Remove',
  },
  faqEditor: {
    editButton: 'Edit this page',
    doneButton: 'Done editing',
    eyebrowLabel: 'Eyebrow',
    titleLabel: 'Title',
    introLabel: 'Intro',
    questionLabel: 'Question',
    answerLabel: 'Answer',
    addItem: 'Add question',
    removeItem: 'Remove',
    reorderLabel: 'Drag to reorder',
    save: 'Save',
    cancel: 'Cancel',
    saveSuccess: 'FAQ saved.',
    saveError: 'Could not save the FAQ.',
  },
  contentEditor: {
    editButton: 'Edit this page',
    save: 'Save',
    cancel: 'Cancel',
    saveSuccess: 'Changes saved.',
    saveError: 'Could not save the changes.',
    draftRestored: 'Unsaved draft restored from your last session.',
    fields: {
      eyebrow: 'Eyebrow',
      title: 'Title',
      intro: 'Intro text',
      shopCta: 'Shop button text',
      journalCta: 'Blog button text',
      highlightsHeading: 'Highlights heading',
      storeHeading: 'Shop section heading',
      viewAll: '"View all" link text',
      journalHeading: 'Blog heading',
      allEntries: '"All entries" link text',
      youtubeHeading: 'YouTube heading',
      youtubeIntro: 'YouTube intro text',
      youtubeVideoCta: 'Latest video button text',
      youtubeChannelCta: 'YouTube channel button text',
      storyHeading: 'Story heading',
      storyBody: 'Story text',
      whyHeading: '"Why amigurumi" heading',
      whyBody: '"Why amigurumi" text',
      nameHeading: 'Name meaning heading',
      nameBody: 'Name meaning text',
      instagram: 'Instagram label',
      youtube: 'YouTube label',
      email: 'Email label',
      commissions: 'Commissions heading',
      commissionsBody: 'Commissions text',
    },
  },
}

const ptBR: Messages = {
  meta: { title: 'Togurumi' },
  nav: {
    home: 'Início',
    shop: 'Loja',
    journal: 'Blog',
    faq: 'Dúvidas',
    contact: 'Contato',
    privacy: 'Privacidade',
    menuLabel: 'Menu',
    menuCloseLabel: 'Fechar menu',
  },
  theme: { system: 'Sistema', day: 'Dia', night: 'Noite', menuLabel: 'Tema' },
  locale: { system: 'Sistema', enUS: 'Inglês', ptBR: 'Português (Brasil)', esES: 'Espanhol', menuLabel: 'Idioma' },
  auth: {
    loginTitle: 'Entrar',
    loginIntro: 'Acesse as ferramentas privadas da Togurumi para gerenciar posts do blog.',
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
    adminJournalCardTitle: 'Editor do blog',
    adminJournalCardBody: 'Crie, edite, traduza e remova posts do blog da Togurumi.',
    adminImagesCardTitle: 'Imagens dos produtos',
    adminImagesCardBody: 'Envie fotos dos produtos e vincule-as ao catálogo do Google Sheets.',
    imagesTitle: 'Imagens dos produtos',
    imagesIntro: 'Escolha um produto do catálogo e envie a foto que deve aparecer na loja.',
    imagesProductLabel: 'Produto',
    imagesColorLabel: 'Imagem para',
    imagesDefaultColor: 'Imagem principal (vitrine e padrão)',
    imagesColorHint: 'Escolha uma cor para dar uma foto própria a essa variação.',
    imagesFileLabel: 'Imagem',
    imagesFileHint: 'JPEG, PNG ou WebP. Máximo de 8 MB.',
    imagesUpload: 'Enviar imagem',
    imagesUploading: 'Enviando...',
    imagesUploadSuccess: 'Imagem enviada e salva no catálogo.',
    imagesUploadError: 'Não foi possível enviar a imagem. Tente novamente.',
    imagesLoadError: 'Não foi possível carregar os produtos do catálogo.',
    imagesInvalidFile: 'Escolha uma imagem JPEG, PNG ou WebP válida de até 8 MB.',
    imagesLoading: 'Carregando produtos...',
    imagesNoProducts: 'Nenhum produto encontrado',
    imagesCurrent: 'Imagem atual',
    imagesNewPreview: 'Prévia da nova imagem',
    imagesNoImage: 'Nenhuma imagem enviada',
    editorTitle: 'Editor do blog',
    newPost: 'Novo post',
    editPost: 'Editar post',
    deletePost: 'Excluir',
    deleteConfirm: 'Excluir este post do blog? Isso não pode ser desfeito.',
    archivePost: 'Arquivar',
    unarchivePost: 'Desarquivar',
    archiveSuccess: 'Post arquivado.',
    unarchiveSuccess: 'Post desarquivado.',
    archivedBadge: 'Arquivado',
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
    emailHint: 'Opcional por enquanto, mas será obrigatório para contas padrão quando o cadastro próprio estiver disponível.',
    invalidEmail: 'Informe um e-mail válido.',
    saveProfile: 'Salvar',
    profileUpdated: 'Perfil atualizado.',
    showPassword: 'Mostrar senha',
    hidePassword: 'Ocultar senha',
    accountMenuLabel: 'Conta',
  },
  footer: {
    tagline: 'feito com uma agulha e muito fio',
    note: 'Amigurumis feitos à mão pela Bella · pedidos e encomendas pelo direct @togurumi',
    navLabel: 'Rodapé',
    socialLabel: 'Redes e contato',
  },
  home: {
    eyebrow: 'トグルミ',
    title: 'Pontinhos pequenos, histórias macias.',
    intro:
      'Amigurumis feitos à mão e anotações de crochê da agulha da Bella: amiguinhos prontos, trabalhos em andamento e o artesanato tranquilo no meio do caminho.',
    shopCta: 'Visitar a loja',
    journalCta: 'Ler o blog',
    highlightsHeading: 'Destaques do mês',
    storeHeading: 'Disponível na loja',
    viewAll: 'Ver tudo →',
    journalHeading: 'Do blog',
    allEntries: 'Todas as entradas →',
    youtubeHeading: 'Assista à Togurumi no YouTube',
    youtubeIntro: 'Veja a Bella dar vida aos fios, ponto por ponto. Comece pelo vídeo mais recente da Togurumi.',
    youtubeVideoCta: 'Assistir ao vídeo mais recente',
    youtubeChannelCta: 'Visitar o canal',
  },
  shop: {
    eyebrow: 'Loja',
    title: 'Amiguinhos, receitas e encomendas',
    intro:
      'Uma coleção crescente de amigurumis, receitas em preparação e notas de encomenda: amiguinhos prontos, detalhes em close, trabalhos em andamento e links conforme ficarem prontos.',
    availableHeading: 'Disponível agora',
    availableEmpty: 'Novas peças estão a caminho, volte em breve!',
    stockLabel: 'Em estoque',
    outOfStock: 'Esgotado',
    allCategories: 'Todos',
    newBadge: 'NOVO!',
    backLink: 'Voltar para a loja',
    yarnLabel: 'Fio',
    coresLabel: 'Cores',
    chooseColorLabel: 'Escolha uma cor',
    selectedColorLabel: 'Cor escolhida',
    designerLabel: 'Designer',
    photoComingSoon: 'Foto em breve',
    comingSoonTitle: 'Mais amiguinhos em breve!',
    comingSoonBody: 'A Bella está preparando novas peças feitas à mão. Volte em breve!',
    addToCart: 'Colocar no carrinho',
    addedToCart: 'Adicionado ao carrinho!',
    deliveryNotice:
      'Por enquanto, as entregas são somente para Curitiba e região metropolitana. Futuramente, atenderemos todos os estados do Brasil.',
    galleryHeading: 'Amiguinhos prontos e trabalhos em andamento',
    galleryItems: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Fio de algodão · 6 pernas (por enquanto)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Verde-sálvia · olhos de botão' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Rosa empoeirado · orelhas caídas' },
      { icon: '🐢', name: 'Shelly the Turtle', tag: 'Concha trigo-mel' },
      { icon: '🦊', name: 'Fennec Fox', tag: 'WIP, orelhas em andamento' },
      { icon: '🐝', name: 'Bumble', tag: 'Abelhinha pequena, personalidade grande' },
      { icon: '🌵', name: 'Pip the Cactus', tag: 'Sem espinhos, só abraços' },
      { icon: '🐱', name: 'Yarn Cat', tag: 'Encomenda personalizada' },
    ],
    patternsHeading: 'Receitas e encomendas',
    patternsIntro:
      'Receitas gratuitas e pagas vão morar aqui, junto com links para Ravelry, Etsy ou downloads em PDF conforme forem ficando prontos. Por enquanto, eis o que está em andamento.',
    commissionCta: 'Enviar mensagem privada',
    patternsItems: [
      {
        name: 'Mochi Bear',
        status: 'Em breve',
        description: 'Um urso redondo e abraçável com bracinhos curtos, indicado para iniciantes.',
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
        description: 'Tem um personagem em mente? Envie uma mensagem privada para @togurumi no Instagram.',
        action: 'commission',
      },
    ],
  },
  journal: {
    eyebrow: 'Blog',
    title: 'Anotações da agulha',
    intro: 'Posts de processo: trabalhos em andamento, escolhas de fio, erros e pequenas vitórias.',
    backLink: '← Voltar ao blog',
    byAuthor: 'Por {{author}}',
  },
  about: {
    eyebrow: 'Sobre',
    title: 'Oi, eu sou a Bella',
    intro:
      'Eu faço amigurumi: bichinhos pequenos de crochê, na maioria animais, às vezes algo mais estranho. "Togurumi" é onde guardo o que estou fazendo, o que aprendi e o que vem a seguir na agulha.',
    storyHeading: 'Minha história',
    storyBody:
      'Aprendi crochê ainda criança, bordando panos de prato com minha bisavó, e em 2020 decidi explorar um outro ramo desse artesanato: o amigurumi. Comecei com essa arte como um tipo de terapia manual, e hoje ela é o meu espaço de autocuidado.',
    whyHeading: 'Por que amigurumi?',
    whyBody:
      'Essa arte de transformar um novelo em algo com personalidade, que pode ser apreciado por diferentes faixas etárias, é mágica pra mim. Criar uma peça que pode ser usada tanto como chaveiro de um adolescente, brinquedo de uma criança, ou um "cacareco" querido de um adulto é o que me move a explorar diferentes formas e cores, para deixar a sua rotina um pouco menos monótona.',
    nameHeading: 'O que "Togurumi" significa',
    nameBody:
      'Um pequeno portmanteau meu: "To" do meu sobrenome, Tomikawa (富川), e "gurumi" de "amigurumi". É o meu cantinho para isso: galeria, blog e (eventualmente) moldes para baixar ou encomendar.',
  },
  contact: {
    eyebrow: 'Contato',
    title: 'Diga oi',
    intro: 'Dúvidas sobre uma peça, interesse em encomenda ou só quer bater papo sobre fio? Manda mensagem.',
    instagram: 'Instagram',
    youtube: 'YouTube',
    email: 'E-mail',
    commissions: 'Encomendas',
    commissionsBody:
      'Personagens personalizados são bem-vindos. Toque aqui para enviar uma mensagem privada para @togurumi no Instagram com sua ideia e fotos de referência, se tiver.',
  },
  notFound: {
    eyebrow: '404',
    title: 'Este ponto não existe',
    body: 'A página que você procura se desfiou. Vamos te colocar de volta no caminho.',
    button: 'Voltar ao início',
  },
  search: {
    ariaLabel: 'Buscar',
    eyebrow: 'Busca',
    title: 'Encontre uma peça',
    placeholder: 'Busque por nome, tipo, fio...',
    noResults: 'Nenhuma peça encontrada para sua busca.',
    filteringBy: 'Filtrando por',
    clearFilter: 'Limpar filtro',
  },
  cart: {
    ariaLabel: 'Carrinho',
    eyebrow: 'Carrinho',
    title: 'Seu carrinho',
    empty: 'Seu carrinho está vazio. Vá encontrar algo para amar.',
    remove: 'Remover',
    total: 'Total',
    continueShopping: 'Continuar comprando',
    checkoutNote: 'A finalização de compra ainda não está disponível, em breve avisaremos quando estiver pronta!',
  },
  reviews: {
    eyebrow: 'Avaliações',
    title: 'O que estão dizendo',
    intro: 'Palavras de quem já recebeu um amiguinho Togurumi em casa. Tem uma também? Adoraríamos ler.',
    formHeading: 'Deixe sua avaliação',
    nameLabel: 'Seu nome',
    namePlaceholder: 'Seu nome',
    ratingLabel: 'Nota',
    commentLabel: 'Sua avaliação',
    commentPlaceholder: 'Conte o que você achou',
    submit: 'Enviar avaliação',
    submitting: 'Enviando...',
    success: 'Obrigada pelas palavras! Sua avaliação foi publicada.',
    errorGeneric: 'Algo deu errado, tente novamente.',
    errorTooMany: 'Espere um momento antes de enviar outra avaliação.',
    empty: 'Ainda não há avaliações, seja a primeira a deixar uma!',
    remove: 'Remover',
  },
  faqEditor: {
    editButton: 'Editar esta página',
    doneButton: 'Concluir edição',
    eyebrowLabel: 'Categoria',
    titleLabel: 'Título',
    introLabel: 'Introdução',
    questionLabel: 'Pergunta',
    answerLabel: 'Resposta',
    addItem: 'Adicionar pergunta',
    removeItem: 'Remover',
    reorderLabel: 'Arraste para reordenar',
    save: 'Salvar',
    cancel: 'Cancelar',
    saveSuccess: 'Dúvidas salvas.',
    saveError: 'Não foi possível salvar as dúvidas.',
  },
  contentEditor: {
    editButton: 'Editar esta página',
    save: 'Salvar',
    cancel: 'Cancelar',
    saveSuccess: 'Alterações salvas.',
    saveError: 'Não foi possível salvar as alterações.',
    draftRestored: 'Rascunho não salvo restaurado da última sessão.',
    fields: {
      eyebrow: 'Categoria',
      title: 'Título',
      intro: 'Texto de introdução',
      shopCta: 'Texto do botão da loja',
      journalCta: 'Texto do botão do blog',
      highlightsHeading: 'Título dos destaques',
      storeHeading: 'Título da seção da loja',
      viewAll: 'Texto do link "ver tudo"',
      journalHeading: 'Título do blog',
      allEntries: 'Texto do link "todas as postagens"',
      youtubeHeading: 'Título do YouTube',
      youtubeIntro: 'Texto de introdução do YouTube',
      youtubeVideoCta: 'Texto do botão do vídeo mais recente',
      youtubeChannelCta: 'Texto do botão do canal do YouTube',
      storyHeading: 'Título da história',
      storyBody: 'Texto da história',
      whyHeading: 'Título do "por que amigurumi"',
      whyBody: 'Texto do "por que amigurumi"',
      nameHeading: 'Título do significado do nome',
      nameBody: 'Texto do significado do nome',
      instagram: 'Rótulo do Instagram',
      youtube: 'Rótulo do YouTube',
      email: 'Rótulo do e-mail',
      commissions: 'Título de encomendas',
      commissionsBody: 'Texto de encomendas',
    },
  },
}

const esES: Messages = {
  meta: { title: 'Togurumi' },
  nav: {
    home: 'Inicio',
    shop: 'Tienda',
    journal: 'Blog',
    faq: 'Preguntas frecuentes',
    contact: 'Contacto',
    privacy: 'Privacidad',
    menuLabel: 'Menú',
    menuCloseLabel: 'Cerrar menú',
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
    adminImagesCardTitle: 'Imágenes de productos',
    adminImagesCardBody: 'Sube fotos de productos y vincúlalas al catálogo de Google Sheets.',
    imagesTitle: 'Imágenes de productos',
    imagesIntro: 'Elige un producto del catálogo y sube la foto que debe aparecer en la tienda.',
    imagesProductLabel: 'Producto',
    imagesColorLabel: 'Imagen para',
    imagesDefaultColor: 'Imagen principal (tarjetas y alternativa)',
    imagesColorHint: 'Elige un color para asignarle su propia foto a esa variante.',
    imagesFileLabel: 'Imagen',
    imagesFileHint: 'JPEG, PNG o WebP. Máximo 8 MB.',
    imagesUpload: 'Subir imagen',
    imagesUploading: 'Subiendo...',
    imagesUploadSuccess: 'Imagen subida y guardada en el catálogo.',
    imagesUploadError: 'No se pudo subir la imagen. Inténtalo de nuevo.',
    imagesLoadError: 'No se pudieron cargar los productos del catálogo.',
    imagesInvalidFile: 'Elige una imagen JPEG, PNG o WebP válida de hasta 8 MB.',
    imagesLoading: 'Cargando productos...',
    imagesNoProducts: 'No se encontraron productos',
    imagesCurrent: 'Imagen actual',
    imagesNewPreview: 'Vista previa de la imagen nueva',
    imagesNoImage: 'No hay ninguna imagen subida',
    editorTitle: 'Editor del diario',
    newPost: 'Nuevo post',
    editPost: 'Editar post',
    deletePost: 'Eliminar',
    deleteConfirm: '¿Eliminar esta publicación del diario? Esta acción no se puede deshacer.',
    archivePost: 'Archivar',
    unarchivePost: 'Desarchivar',
    archiveSuccess: 'Post archivado.',
    unarchiveSuccess: 'Post desarchivado.',
    archivedBadge: 'Archivado',
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
    emailHint: 'Opcional por ahora, pero será obligatorio para cuentas estándar cuando el registro propio esté disponible.',
    invalidEmail: 'Ingresa un correo electrónico válido.',
    saveProfile: 'Guardar',
    profileUpdated: 'Perfil actualizado.',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    accountMenuLabel: 'Cuenta',
  },
  footer: {
    tagline: 'hecho con una aguja y mucho hilo',
    note: 'Amigurumis hechos a mano por Bella · pedidos y encargos por el direct de Instagram @togurumi',
    navLabel: 'Pie de página',
    socialLabel: 'Redes y contacto',
  },
  home: {
    eyebrow: 'トグルミ',
    title: 'Puntadas pequeñas, historias suaves.',
    intro:
      'Amigurumis hechos a mano y notas de crochet del gancho de Bella: amiguitos terminados, trabajos en progreso y el oficio tranquilo entre medio.',
    shopCta: 'Visitar la tienda',
    journalCta: 'Leer el diario',
    highlightsHeading: 'Destacados del mes',
    storeHeading: 'Disponible en la tienda',
    viewAll: 'Ver todo →',
    journalHeading: 'Del diario',
    allEntries: 'Todas las entradas →',
    youtubeHeading: 'Mira Togurumi en YouTube',
    youtubeIntro: 'Mira cómo Bella da vida al hilo, puntada a puntada. Empieza por el video más reciente de Togurumi.',
    youtubeVideoCta: 'Ver el video más reciente',
    youtubeChannelCta: 'Visitar el canal',
  },
  shop: {
    eyebrow: 'Tienda',
    title: 'Amiguitos, patrones y encargos',
    intro:
      'Una colección creciente de amigurumis, patrones en preparación y notas de encargos: amiguitos terminados, primeros planos, trabajos en progreso y enlaces cuando estén listos.',
    availableHeading: 'Disponible ahora',
    availableEmpty: '¡Nuevas piezas en camino, vuelve pronto!',
    stockLabel: 'En stock',
    outOfStock: 'Agotado',
    allCategories: 'Todos',
    newBadge: '¡NUEVO!',
    backLink: 'Volver a la tienda',
    yarnLabel: 'Hilo',
    coresLabel: 'Colores',
    chooseColorLabel: 'Elige un color',
    selectedColorLabel: 'Color elegido',
    designerLabel: 'Diseñador',
    photoComingSoon: 'Foto próximamente',
    comingSoonTitle: '¡Más amiguitos próximamente!',
    comingSoonBody: 'Bella está preparando nuevas piezas hechas a mano. ¡Vuelve pronto!',
    addToCart: 'Añadir al carrito',
    addedToCart: '¡Añadido al carrito!',
    deliveryNotice:
      'Por ahora, las entregas son solo para Curitiba y su región metropolitana. Más adelante enviaremos a todos los estados de Brasil.',
    galleryHeading: 'Amiguitos terminados y trabajos en progreso',
    galleryItems: [
      { icon: '🐙', name: 'Ollie the Octopus', tag: 'Hilo de algodón · 6 patas (por ahora)' },
      { icon: '🐻', name: 'Mochi Bear', tag: 'Verde salvia · ojos de botón' },
      { icon: '🐰', name: 'Clover the Bunny', tag: 'Rosa empolvado · orejas caídas' },
      { icon: '🐢', name: 'Shelly the Turtle', tag: 'Caparazón color miel' },
      { icon: '🦊', name: 'Fennec Fox', tag: 'En progreso, orejas en proceso' },
      { icon: '🐝', name: 'Bumble', tag: 'Abejita pequeña, gran personalidad' },
      { icon: '🌵', name: 'Pip the Cactus', tag: 'Sin espinas, solo abrazos' },
      { icon: '🐱', name: 'Yarn Cat', tag: 'Encargo personalizado' },
    ],
    patternsHeading: 'Patrones y encargos',
    patternsIntro:
      'Aquí vivirán patrones gratuitos y de pago, junto con enlaces a Ravelry, Etsy o descargas en PDF cuando estén listos. Por ahora, esto es lo que está en marcha.',
    commissionCta: 'Enviar mensaje privado',
    patternsItems: [
      {
        name: 'Mochi Bear',
        status: 'Próximamente',
        description: 'Un oso redondo y abrazable con brazos cortitos, apto para principiantes.',
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
        description: '¿Tienes un personaje en mente? Envía un mensaje privado a @togurumi en Instagram.',
        action: 'commission',
      },
    ],
  },
  journal: {
    eyebrow: 'Diario',
    title: 'Notas desde el gancho',
    intro: 'Publicaciones de proceso: trabajos en progreso, elecciones de hilo, errores y pequeños logros.',
    backLink: '← Volver al diario',
    byAuthor: 'Por {{author}}',
  },
  about: {
    eyebrow: 'Acerca de',
    title: 'Hola, soy Bella',
    intro:
      'Hago amigurumis: pequeñas criaturas tejidas a crochet, sobre todo animales, a veces algo más extraño. "Togurumi" es donde guardo registro de lo que estoy haciendo, lo que he aprendido y lo que viene a continuación en el gancho.',
    storyHeading: 'Mi historia',
    storyBody:
      'Aprendí a tejer a crochet de niña, bordando paños de cocina con mi bisabuela, y en 2020 decidí explorar otra rama de esta artesanía: el amigurumi. Empecé con este arte como una especie de terapia manual, y hoy es mi espacio de autocuidado.',
    whyHeading: '¿Por qué amigurumi?',
    whyBody:
      'El arte de convertir un ovillo de lana en algo con personalidad, que personas de cualquier edad pueden disfrutar, es mágico para mí. Crear una pieza que puede ser el llavero de un adolescente, el juguete de un niño o el querido "cacharrito" de un adulto es lo que me impulsa a explorar nuevas formas y colores, para hacer tu día a día un poco menos monótono.',
    nameHeading: 'Qué significa "Togurumi"',
    nameBody:
      'Un pequeño acrónimo propio: "To" de mi apellido, Tomikawa (富川), y "gurumi" de "amigurumi". Este es mi rincón para ello: galería, diario y (eventualmente) patrones para descargar o encargar.',
  },
  contact: {
    eyebrow: 'Contacto',
    title: 'Saluda',
    intro: '¿Preguntas sobre una pieza, interesado en un encargo, o solo quieres charlar sobre hilos? Escríbeme.',
    instagram: 'Instagram',
    youtube: 'YouTube',
    email: 'Correo electrónico',
    commissions: 'Encargos',
    commissionsBody:
      'Personajes personalizados son bienvenidos. Toca aquí para enviar un mensaje privado a @togurumi en Instagram con tu idea y fotos de referencia, si tienes.',
  },
  notFound: {
    eyebrow: '404',
    title: 'Esta puntada no existe',
    body: 'La página que buscas se ha deshilado. Vamos a regresarte al buen camino.',
    button: 'Volver al inicio',
  },
  search: {
    ariaLabel: 'Buscar',
    eyebrow: 'Búsqueda',
    title: 'Encuentra una pieza',
    placeholder: 'Busca por nombre, tipo, hilo...',
    noResults: 'Ninguna pieza coincide con tu búsqueda.',
    filteringBy: 'Filtrando por',
    clearFilter: 'Limpiar filtro',
  },
  cart: {
    ariaLabel: 'Carrito',
    eyebrow: 'Carrito',
    title: 'Tu carrito',
    empty: 'Tu carrito está vacío. Ve a encontrar algo para amar.',
    remove: 'Eliminar',
    total: 'Total',
    continueShopping: 'Seguir comprando',
    checkoutNote: 'El pago todavía no está disponible, ¡te avisaremos en cuanto esté listo!',
  },
  reviews: {
    eyebrow: 'Reseñas',
    title: 'Lo que dicen de nosotras',
    intro: 'Palabras de quienes ya recibieron un amiguito Togurumi en casa. ¿Tienes una propia? Nos encantaría leerla.',
    formHeading: 'Deja tu reseña',
    nameLabel: 'Tu nombre',
    namePlaceholder: 'Tu nombre',
    ratingLabel: 'Calificación',
    commentLabel: 'Tu reseña',
    commentPlaceholder: 'Cuéntanos qué te pareció',
    submit: 'Enviar reseña',
    submitting: 'Enviando...',
    success: '¡Gracias por tus palabras! Tu reseña ha sido publicada.',
    errorGeneric: 'Algo salió mal, intenta de nuevo.',
    errorTooMany: 'Espera un momento antes de enviar otra reseña.',
    empty: 'Todavía no hay reseñas, sé la primera en dejar una.',
    remove: 'Eliminar',
  },
  faqEditor: {
    editButton: 'Editar esta página',
    doneButton: 'Terminar edición',
    eyebrowLabel: 'Categoría',
    titleLabel: 'Título',
    introLabel: 'Introducción',
    questionLabel: 'Pregunta',
    answerLabel: 'Respuesta',
    addItem: 'Agregar pregunta',
    removeItem: 'Eliminar',
    reorderLabel: 'Arrastra para reordenar',
    save: 'Guardar',
    cancel: 'Cancelar',
    saveSuccess: 'Preguntas frecuentes guardadas.',
    saveError: 'No se pudieron guardar las preguntas frecuentes.',
  },
  contentEditor: {
    editButton: 'Editar esta página',
    save: 'Guardar',
    cancel: 'Cancelar',
    saveSuccess: 'Cambios guardados.',
    saveError: 'No se pudieron guardar los cambios.',
    draftRestored: 'Borrador sin guardar restaurado de la última sesión.',
    fields: {
      eyebrow: 'Categoría',
      title: 'Título',
      intro: 'Texto de introducción',
      shopCta: 'Texto del botón de la tienda',
      journalCta: 'Texto del botón del blog',
      highlightsHeading: 'Título de destacados',
      storeHeading: 'Título de la sección de la tienda',
      viewAll: 'Texto del enlace "ver todo"',
      journalHeading: 'Título del blog',
      allEntries: 'Texto del enlace "todas las entradas"',
      youtubeHeading: 'Título de YouTube',
      youtubeIntro: 'Texto de introducción de YouTube',
      youtubeVideoCta: 'Texto del botón del video más reciente',
      youtubeChannelCta: 'Texto del botón del canal de YouTube',
      storyHeading: 'Título de la historia',
      storyBody: 'Texto de la historia',
      whyHeading: 'Título de "por qué amigurumi"',
      whyBody: 'Texto de "por qué amigurumi"',
      nameHeading: 'Título del significado del nombre',
      nameBody: 'Texto del significado del nombre',
      instagram: 'Etiqueta de Instagram',
      youtube: 'Etiqueta de YouTube',
      email: 'Etiqueta de correo',
      commissions: 'Título de encargos',
      commissionsBody: 'Texto de encargos',
    },
  },
}

export function getMessages(locale: SupportedLocale): Messages {
  if (locale === 'pt-BR') return ptBR
  if (locale === 'es-ES') return esES
  return enUS
}
