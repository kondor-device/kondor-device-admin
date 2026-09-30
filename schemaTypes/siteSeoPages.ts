import {defineField, defineType} from 'sanity'

export type SeoSingletonConfig = {
  name: string
  title: string
  subtitle: string
}

// SEO singletons of the static pages of the site (kondor-device-frontend, src/app/[locale]/...).
// The document `_id` equals the type name: the frontend reads them by that fixed id.
// The order-confirmation page has no singleton — it is not indexed.
export const SITE_SEO_PAGE_CONFIGS: readonly SeoSingletonConfig[] = [
  {name: 'seoHomePage', title: 'Головна сторінка', subtitle: 'SEO для головної'},
  {name: 'seoCatalogPage', title: 'Каталог', subtitle: 'SEO для сторінки каталогу'},
  {name: 'seoAboutPage', title: 'Про нас', subtitle: 'SEO для сторінки «Про нас»'},
  {name: 'seoDeliveryPage', title: 'Доставка та оплата', subtitle: 'SEO для сторінки доставки'},
  {name: 'seoReturnsPage', title: 'Повернення', subtitle: 'SEO для сторінки повернення'},
  {name: 'seoWarrantyPage', title: 'Гарантія', subtitle: 'SEO для сторінки гарантії'},
  {
    name: 'seoPolicyPage',
    title: 'Політика конфіденційності',
    subtitle: 'SEO для сторінки політики',
  },
]

const createSeoSingleton = ({name, title, subtitle}: SeoSingletonConfig) =>
  defineType({
    name,
    title,
    type: 'document',
    fields: [defineField({name: 'seo', title: 'SEO блок', type: 'seoSettings'})],
    preview: {
      prepare() {
        return {title, subtitle}
      },
    },
  })

export const siteSeoPageTypes = SITE_SEO_PAGE_CONFIGS.map(createSeoSingleton)

export const SEO_SINGLETON_TYPES: readonly string[] = SITE_SEO_PAGE_CONFIGS.map((page) => page.name)
