import {defineField, defineType} from 'sanity'

export const REVIEW_STATUSES = [
  {title: 'На модерації', value: 'pending'},
  {title: 'Схвалено', value: 'approved'},
  {title: 'Відхилено', value: 'rejected'},
]

const STATUS_ICONS: Record<string, string> = {pending: '🕓', approved: '✅', rejected: '❌'}

export const review = defineType({
  name: 'review',
  title: 'Відгук',
  type: 'document',
  description:
    'Відгуки створюються з форми на сайті та модеруються в Telegram-каналі. Статус можна змінити і тут.',
  fields: [
    defineField({
      name: 'item',
      title: 'Товар',
      type: 'reference',
      to: [{type: 'item'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Ім’я',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(30),
    }),
    defineField({
      name: 'phone',
      title: 'Телефон',
      type: 'string',
      description: 'Не показується на сайті.',
    }),
    defineField({
      name: 'rating',
      title: 'Оцінка',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'text',
      title: 'Текст відгуку',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().min(2).max(500),
    }),
    defineField({
      name: 'status',
      title: 'Статус',
      type: 'string',
      options: {list: REVIEW_STATUSES, layout: 'radio'},
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Дата відгуку',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'moderatedAt',
      title: 'Дата модерації',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'moderatedBy',
      title: 'Хто модерував',
      type: 'string',
      description: 'Telegram-користувач, який натиснув кнопку в каналі.',
      readOnly: true,
    }),
    defineField({
      name: 'locale',
      title: 'Мова сайту',
      type: 'string',
      options: {list: ['uk', 'ru']},
      readOnly: true,
    }),
    defineField({
      name: 'telegramMessageId',
      title: 'ID повідомлення в Telegram',
      type: 'number',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Спочатку нові',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {author: 'author', rating: 'rating', status: 'status', item: 'item.name', text: 'text'},
    prepare: ({author, rating, status, item, text}) => ({
      title: `${STATUS_ICONS[status] ?? ''} ${author ?? 'Без імені'} · ${'★'.repeat(rating ?? 0)}`,
      subtitle: [item, text].filter(Boolean).join(' — '),
    }),
  },
})
