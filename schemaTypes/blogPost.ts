import {defineField, defineType} from 'sanity'
import {defineRuField} from './ruField'
import {articlePortableTextOf} from './blog/articlePortableText'
import {validateRuArray} from './blog/localeValidation'

const imageWithAlt = (name: string, title: string) =>
  defineField({
    name,
    type: 'image',
    title,
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        type: 'string',
        title: 'Альтернативний текст',
        description: 'Важливо для SEO та доступності',
      }),
      defineRuField({
        name: 'altRu',
        title: 'Альтернативний текст (RU)',
        type: 'string',
        ukField: 'alt',
      }),
    ],
    validation: (rule) => rule.required(),
  })

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Стаття блогу',
  type: 'document',
  fields: [
    // Hero
    defineField({
      name: 'heroTitle',
      type: 'string',
      title: 'Заголовок (Hero)',
      validation: (rule) => rule.required(),
    }),
    defineRuField({
      name: 'heroTitleRu',
      title: 'Заголовок (Hero) (RU)',
      type: 'string',
      ukField: 'heroTitle',
    }),
    defineField({
      name: 'heroDescription',
      type: 'text',
      rows: 4,
      title: 'Опис (Hero)',
      description:
        'Використовується також як короткий опис на картці (можна додати перенос рядків)',
      validation: (rule) => rule.required(),
    }),
    defineRuField({
      name: 'heroDescriptionRu',
      title: 'Опис (Hero) (RU)',
      type: 'text',
      rows: 4,
      ukField: 'heroDescription',
    }),
    imageWithAlt('heroDesktopImage', 'Зображення для десктопа (Hero)'),
    imageWithAlt(
      'heroMobileImage',
      'Зображення для мобільних (Hero, використовується і на картці)',
    ),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Адреса (slug)',
      description: 'Генерується із заголовка; спільна для української та російської версій',
      validation: (rule) => rule.required(),
      options: {
        source: 'heroTitle',
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9а-яіїєґ/\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-'),
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      title: 'Дата публікації',
      description: 'Показується на сторінках і визначає порядок статей у списку',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      type: 'reference',
      title: 'Автор',
      to: [{type: 'blogAuthor'}],
      validation: (rule) => rule.required(),
    }),
    // Контент
    defineField({
      name: 'content',
      type: 'array',
      title: 'Основний контент',
      description: 'Заголовки, параграфи, списки, зображення, таблиці, галереї, кнопки',
      of: articlePortableTextOf,
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'contentRu',
      type: 'array',
      title: 'Основний контент (RU)',
      description: 'Російська версія. Обов’язкова, якщо заповнена українська.',
      of: articlePortableTextOf,
      validation: (rule) =>
        rule.custom((value, context) => validateRuArray(value, context, 'content')),
    }),
    defineField({
      name: 'customFaq',
      type: 'array',
      title: 'FAQ для цієї статті',
      description: 'Питання та відповіді вручну — кожна стаття має власний FAQ.',
      of: [{type: 'faqQuestion'}],
    }),
    defineField({name: 'seo', type: 'seoSettings', title: 'SEO блок'}),
  ],
  orderings: [
    {
      title: 'Дата публікації (нові зверху)',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'heroTitle',
      slug: 'slug.current',
      image: 'heroMobileImage',
      authorName: 'author.name',
    },
    prepare({title, slug, image, authorName}) {
      const slugPart = slug ? `/${slug}` : 'Slug не налаштований'
      return {
        title: title || 'Без назви',
        subtitle: authorName ? `${slugPart} · ${authorName}` : slugPart,
        media: image,
      }
    },
  },
})
