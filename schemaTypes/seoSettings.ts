import {defineField, defineType} from 'sanity'
import {defineRuField} from './ruField'

export const seoSettings = defineType({
  name: 'seoSettings',
  title: 'SEO налаштування',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      type: 'string',
      title: 'SEO title',
      description: 'Заголовок сторінки для пошукових систем (до 60 символів)',
      validation: (rule) => rule.max(60),
    }),
    defineRuField({
      name: 'metaTitleRu',
      title: 'SEO title (RU)',
      type: 'string',
      ukField: 'metaTitle',
    }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      rows: 3,
      title: 'SEO description',
      description: 'Короткий опис сторінки (до 160 символів)',
      validation: (rule) => rule.max(260),
    }),
    defineRuField({
      name: 'metaDescriptionRu',
      title: 'SEO description (RU)',
      type: 'text',
      rows: 3,
      ukField: 'metaDescription',
    }),
    defineField({
      name: 'opengraphImage',
      type: 'image',
      title: 'Open Graph зображення',
      description: 'Зображення для соцмереж (1200×630 px). Якщо порожньо — hero-зображення статті',
      options: {hotspot: true},
    }),
    defineField({
      name: 'schemaJson',
      type: 'file',
      title: 'schema.org JSON',
      description: 'Завантажте JSON-файл зі структурованими даними',
      options: {accept: 'application/json', storeOriginalFilename: true},
    }),
  ],
})
