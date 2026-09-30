import {defineField, defineType} from 'sanity'
import {defineRuField} from './ruField'

// Reusable SEO block: used by categories and by the SEO singletons of the static pages.
// Products and sets keep their own flat seoTitle / seoDescription / seoImage fields.
// Russian values (`<field>Ru`) fall back to the Ukrainian ones on the site.
export const seoSettings = defineType({
  name: 'seoSettings',
  title: 'SEO налаштування',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'SEO title',
      type: 'string',
      description: 'Заголовок сторінки для пошукових систем (до 60 символів).',
      validation: (rule) => rule.max(60).warning('Рекомендується не більше 60 символів'),
    }),
    defineRuField({
      name: 'metaTitleRu',
      title: 'SEO title (RU)',
      type: 'string',
      ukField: 'metaTitle',
      maxLength: 60,
    }),
    defineField({
      name: 'metaDescription',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      description: 'Короткий опис сторінки для пошукових систем (до 160 символів).',
      validation: (rule) => rule.max(160).warning('Рекомендується не більше 160 символів'),
    }),
    defineRuField({
      name: 'metaDescriptionRu',
      title: 'SEO description (RU)',
      type: 'text',
      rows: 3,
      ukField: 'metaDescription',
      maxLength: 160,
    }),
    defineField({
      name: 'keywords',
      title: 'Ключові слова',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: 'Необов’язково. Додайте ключові слова тегами.',
    }),
    defineField({
      name: 'keywordsRu',
      title: 'Ключові слова (RU)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: 'Необов’язково. Якщо порожньо — використовуються українські.',
    }),
    defineField({
      name: 'opengraphTitle',
      title: 'OG title',
      type: 'string',
      description: 'Заголовок для соцмереж. Якщо порожньо — використовується SEO title.',
      validation: (rule) => rule.max(70).warning('Рекомендується не більше 70 символів'),
    }),
    defineRuField({
      name: 'opengraphTitleRu',
      title: 'OG title (RU)',
      type: 'string',
      ukField: 'opengraphTitle',
      maxLength: 70,
    }),
    defineField({
      name: 'opengraphDescription',
      title: 'OG description',
      type: 'text',
      rows: 3,
      description: 'Опис для соцмереж. Якщо порожньо — використовується SEO description.',
      validation: (rule) => rule.max(300).warning('Рекомендується не більше 300 символів'),
    }),
    defineRuField({
      name: 'opengraphDescriptionRu',
      title: 'OG description (RU)',
      type: 'text',
      rows: 3,
      ukField: 'opengraphDescription',
      maxLength: 300,
    }),
    defineField({
      name: 'opengraphImage',
      title: 'Open Graph зображення',
      type: 'image',
      description:
        'Зображення для соцмереж (1200×630 px). Якщо порожньо — використовується стандартне зображення сайту.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-текст',
          type: 'string',
          description: 'Опис зображення українською мовою.',
        }),
        defineRuField({
          name: 'altRu',
          title: 'Alt-текст (RU)',
          type: 'string',
          ukField: 'alt',
        }),
      ],
    }),
    defineField({
      name: 'schemaJson',
      title: 'schema.org JSON',
      type: 'file',
      description: 'Необов’язково. Завантажте JSON-файл зі структурованими даними (JSON-LD).',
      options: {accept: 'application/json', storeOriginalFilename: true},
    }),
  ],
})
