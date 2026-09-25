import {defineField, defineType} from 'sanity'
import {defineRuField} from './ruField'

export const badge = defineType({
  name: 'badge',
  title: 'Бейдж',
  type: 'document',
  fields: [
    defineField({
      name: 'text',
      title: 'Текст бейджа',
      type: 'string',
      description: 'Короткий напис, який відображається на картці товару.',
      validation: (rule) => rule.required().max(30).warning('Рекомендується не більше 30 символів'),
    }),
    defineRuField({
      name: 'textRu',
      title: 'Текст бейджа (RU)',
      type: 'string',
      ukField: 'text',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Колір заливки',
      type: 'color',
      options: {disableAlpha: true},
    }),
  ],
  preview: {
    select: {
      title: 'text',
      color: 'backgroundColor.hex',
    },
    prepare(selection) {
      const {title, color} = selection
      return {
        title,
        subtitle: color ? `Колір: ${color}` : undefined,
      }
    },
  },
})
