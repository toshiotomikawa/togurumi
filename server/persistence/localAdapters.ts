import {
  createPost,
  deletePost,
  getPost,
  listAllPosts,
  setPostArchived,
  updatePost,
} from '../journal'
import { getFaqContent, updateFaqContent } from '../faq'
import { addReview, deleteReview, listReviews } from '../reviews'
import { getSiteContentSection, updateSiteContentSection } from '../siteContent'
import {
  createGoogleUser,
  createUser,
  ensureSeedUser,
  findUser,
  findUserByGoogleId,
  saveUser,
} from '../store'
import type { FaqStore, JournalStore, ReviewStore, SiteContentStore, UserStore } from './contracts'

export const localUserStore: UserStore = {
  findByUsername: findUser,
  findByGoogleId: findUserByGoogleId,
  save: saveUser,
  createWithPassword: createUser,
  createWithGoogle: createGoogleUser,
  ensureSeed: ensureSeedUser,
}

export const localReviewStore: ReviewStore = {
  list: listReviews,
  add: addReview,
  delete: deleteReview,
}

export const localSiteContentStore: SiteContentStore = {
  get: getSiteContentSection,
  update: updateSiteContentSection,
}

export const localFaqStore: FaqStore = {
  get: getFaqContent,
  update: updateFaqContent,
}

export const localJournalStore: JournalStore = {
  list: listAllPosts,
  get: getPost,
  create: createPost,
  update: updatePost,
  delete: deletePost,
  setArchived: setPostArchived,
}
