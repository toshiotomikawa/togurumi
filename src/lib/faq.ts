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
