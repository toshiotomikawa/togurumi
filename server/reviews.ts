import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type ReviewRecord = {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: number
}

type ReviewDatabase = {
  reviews: ReviewRecord[]
}

const reviewsPath = path.resolve('content', 'reviews.json')

export class ReviewError extends Error {
  constructor(public code: 'invalid_name' | 'invalid_rating' | 'invalid_comment') {
    super(code)
  }
}

async function loadDb(): Promise<ReviewDatabase> {
  try {
    const raw = await readFile(reviewsPath, 'utf8')
    const db = JSON.parse(raw) as { reviews: Partial<ReviewRecord>[] }
    return {
      reviews: db.reviews.map((review) => ({
        id: review.id ?? randomUUID(),
        name: review.name ?? '',
        rating: review.rating ?? 5,
        comment: review.comment ?? '',
        createdAt: review.createdAt ?? Date.now(),
      })),
    }
  } catch {
    return { reviews: [] }
  }
}

async function writeDb(db: ReviewDatabase) {
  await writeFile(reviewsPath, JSON.stringify(db, null, 2), 'utf8')
}

export async function listReviews(): Promise<ReviewRecord[]> {
  const db = await loadDb()
  return db.reviews.slice().sort((a, b) => b.createdAt - a.createdAt)
}

export async function addReview(input: { name: string; rating: number; comment: string }): Promise<ReviewRecord> {
  const name = input.name.trim().slice(0, 60)
  const comment = input.comment.trim().slice(0, 600)
  const rating = Math.round(input.rating)

  if (!name) throw new ReviewError('invalid_name')
  if (!comment) throw new ReviewError('invalid_comment')
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new ReviewError('invalid_rating')

  const review: ReviewRecord = {
    id: randomUUID(),
    name,
    rating,
    comment,
    createdAt: Date.now(),
  }

  const db = await loadDb()
  db.reviews.push(review)
  await writeDb(db)
  return review
}

export async function deleteReview(id: string): Promise<boolean> {
  const db = await loadDb()
  const index = db.reviews.findIndex((review) => review.id === id)
  if (index === -1) return false

  db.reviews.splice(index, 1)
  await writeDb(db)
  return true
}
