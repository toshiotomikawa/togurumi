export type ReviewRecord = {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: number
}

export function formatReviewDate(createdAt: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(createdAt))
}
