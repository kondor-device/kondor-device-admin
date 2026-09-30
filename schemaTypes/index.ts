import {badge} from './badge'
import {bundle} from './bundle'
import {category} from './category'
import {item} from './item'
import {promocode} from './promocode'
import {seoSettings} from './seoSettings'
import {siteSeoPageTypes} from './siteSeoPages'

export const schemaTypes = [
  badge,
  bundle,
  category,
  item,
  promocode,
  seoSettings,
  ...siteSeoPageTypes,
]
