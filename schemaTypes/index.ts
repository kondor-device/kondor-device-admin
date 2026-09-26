import {badge} from './badge'
import {category} from './category'
import {item} from './item'
import {promocode} from './promocode'
import {blogPost} from './blogPost'
import {blogAuthor} from './blogAuthor'
import {blogPage} from './blogPage'
import {seoSettings} from './seoSettings'
import {faqQuestion} from './faqQuestion'
import {faqAnswerButton} from './faqAnswerButton'
import {gallerySection} from './gallerySection'

export const schemaTypes = [
  badge,
  category,
  item,
  promocode,
  // blog documents
  blogPost,
  blogAuthor,
  blogPage,
  // blog support objects
  seoSettings,
  faqQuestion,
  faqAnswerButton,
  gallerySection,
]
