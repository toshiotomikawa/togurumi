import {
  createPost,
  deletePost,
  getPost,
  getPublicPost,
  listPublicPosts,
  listAllPosts,
  setPostArchived,
  updatePost,
} from '../journal.js'
import { getFaqContent, updateFaqContent } from '../faq.js'
import { addReview, deleteReview, listReviews } from '../reviews.js'
import { getSiteContentSection, updateSiteContentSection } from '../siteContent.js'
import {
  createGoogleUser,
  createUser,
  ensureSeedUser,
  findUser,
  findUserByGoogleId,
  saveUser,
} from '../store.js'
import type { FaqStore, JournalStore, ReviewStore, SiteContentStore, UserStore } from './contracts.js'

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
  listPublic: listPublicPosts,
  getPublic: getPublicPost,
}
