import defaultBooks from '../data/books.js'
import { createEntitySlugHelpers, transliterateBengaliToSlug } from './slug.js'

function getTitleText(book) {
  if (!book) return ''
  if (typeof book === 'string') return book
  return book.title?.bn || book.title?.en || book.title || ''
}

const {
  getSlug: getBookSlug,
  getPath: getBookPath,
  findBySlugOrId: findBookBySlugOrId,
} = createEntitySlugHelpers({
  defaultList: defaultBooks,
  basePath: '/books',
  fallbackPrefix: 'book',
  getText: getTitleText,
})

export { transliterateBengaliToSlug, getBookSlug, getBookPath, findBookBySlugOrId }
