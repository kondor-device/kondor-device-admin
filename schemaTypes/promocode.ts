import {defineField, defineType} from 'sanity'

export const promocode = defineType({
  name: 'promocode',
  title: 'Промокод',
  type: 'document',
  fields: [
    defineField({
      name: 'promocode',
      title: 'Промокод',
      type: 'string',
      description: 'Текст промокоду, який вводить користувач. Має співпадати з версією у Dato CMS.',
      validation: (rule) => rule.required().min(2),
    }),
    defineField({
      name: 'discount',
      title: 'Знижка (%)',
      type: 'number',
      description: 'Числове значення знижки, яке передається на фронтенд.',
      validation: (rule) => rule.required().min(0),
    }),
  ],
  preview: {
    select: {
      title: 'promocode',
      subtitle: 'discount',
    },
    prepare({title, subtitle}) {
      return {
        title,
        subtitle: subtitle !== undefined ? `Знижка: ${subtitle}%` : undefined,
      }
    },
  },
})
