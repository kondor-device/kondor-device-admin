import {defineField, defineType} from 'sanity'
import {defineRuField} from './ruField'

export const blogAuthor = defineType({
  name: 'blogAuthor',
  title: 'Автор блогу',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Ім’я',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineRuField({name: 'nameRu', title: 'Ім’я (RU)', type: 'string', ukField: 'name'}),
    defineField({
      name: 'photo',
      title: 'Фото',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alt-текст', type: 'string'}),
        defineRuField({name: 'altRu', title: 'Alt-текст (RU)', type: 'string', ukField: 'alt'}),
      ],
    }),
    defineField({
      name: 'profileUrl',
      title: 'Посилання на профіль',
      description: 'URL сторінки автора (внутрішній або зовнішній)',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'name', media: 'photo'},
    prepare: ({title, media}) => ({title: title || 'Без імені', media}),
  },
})
