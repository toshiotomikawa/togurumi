export type HomeContent = {
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

export type AboutContent = {
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

export type ContactContent = {
  title: string
  intro: string
  instagram: string
  youtube: string
  email: string
  commissions: string
  commissionsBody: string
}

export type IntroContent = {
  eyebrow: string
  title: string
  intro: string
}

export type SiteContentMap = {
  home: HomeContent
  about: AboutContent
  contact: ContactContent
  shop: IntroContent
  journal: IntroContent
  reviews: IntroContent
}

export type SiteContentSection = keyof SiteContentMap

export const SITE_CONTENT_FIELDS: { [K in SiteContentSection]: (keyof SiteContentMap[K])[] } = {
  home: [
    'eyebrow',
    'title',
    'intro',
    'shopCta',
    'journalCta',
    'highlightsHeading',
    'storeHeading',
    'viewAll',
    'journalHeading',
    'allEntries',
    'youtubeHeading',
    'youtubeIntro',
    'youtubeVideoCta',
    'youtubeChannelCta',
  ],
  about: ['eyebrow', 'title', 'intro', 'storyHeading', 'storyBody', 'whyHeading', 'whyBody', 'nameHeading', 'nameBody'],
  contact: ['title', 'intro', 'instagram', 'youtube', 'email', 'commissions', 'commissionsBody'],
  shop: ['eyebrow', 'title', 'intro'],
  journal: ['eyebrow', 'title', 'intro'],
  reviews: ['eyebrow', 'title', 'intro'],
}
