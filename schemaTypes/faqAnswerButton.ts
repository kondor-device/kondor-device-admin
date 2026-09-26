import {defineField, defineType} from 'sanity'

/**
 * Кнопка всередині Portable Text (стаття блогу, відповідь FAQ).
 * Текст кнопки — звичайний рядок: українська і російська версії
 * лежать у окремих Portable Text-полях (`content` / `contentRu`).
 */
export const faqAnswerButton = defineType({
  name: 'faqAnswerButton',
  title: 'Кнопка',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Назва',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Посилання',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'newTab',
      title: 'Відкривати в окремому вікні',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {label: 'label', href: 'href'},
    prepare: ({label, href}) => ({title: label || 'Кнопка', subtitle: href}),
  },
})
