import defaultAuthors from '../data/authors.js'
import { createEntitySlugHelpers } from './slug.js'

function getAuthorNameText(author) {
  if (!author) return ''
  if (typeof author === 'string') return author
  return author.name?.bn || author.name?.en || author.name || ''
}

const {
  getSlug: getAuthorSlug,
  getPath: getAuthorPath,
  findBySlugOrId: findAuthorBySlugOrId,
} = createEntitySlugHelpers({
  defaultList: defaultAuthors,
  basePath: '/authors',
  fallbackPrefix: 'author',
  getText: getAuthorNameText,
})

export { getAuthorSlug, getAuthorPath, findAuthorBySlugOrId }
