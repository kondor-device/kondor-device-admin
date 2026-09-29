import {badge} from './badge'
import {bundle} from './bundle'
import {category} from './category'
import {item} from './item'
import {review} from './review'
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
  bundle,
  category,
  item,
  review,
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
