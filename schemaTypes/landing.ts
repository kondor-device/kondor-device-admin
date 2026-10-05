import {defineArrayMember, defineField} from 'sanity'
import {defineRuField} from './ruField'

// «Лендінг товару»: 8 секцій з фіксованою структурою, які сайт показує після основного
// контенту сторінки товару. Декор (лого, зірочки, нумерація, фон смуги) малюється на сайті,
// тут задаються лише тексти, фото та кольори. Порожня секція на сайті не виводиться.

const colorField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'color',
    options: {disableAlpha: true},
    ...(description ? {description} : {}),
  })

const imageField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    ...(description ? {description} : {}),
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt-текст',
        type: 'string',
        description: 'Опис фото українською мовою.',
      }),
      defineRuField({
        name: 'altRu',
        title: 'Alt-текст (RU)',
        type: 'string',
        ukField: 'alt',
      }),
    ],
  })

// An uk + ru pair of fields
const textFields = (
  name: string,
  title: string,
  type: 'string' | 'text' = 'string',
  options: {rows?: number; description?: string} = {},
) => [
  defineField({
    name,
    title,
    type,
    ...(options.rows ? {rows: options.rows} : {}),
    ...(options.description ? {description: options.description} : {}),
  }),
  defineRuField({
    name: `${name}Ru`,
    title: `${title} (RU)`,
    type,
    ...(options.rows ? {rows: options.rows} : {}),
    ukField: name,
  }),
]

const section = (name: string, title: string, fields: ReturnType<typeof defineField>[]) =>
  defineField({
    name,
    title,
    type: 'object',
    options: {collapsible: true, collapsed: true},
    fields,
  })

// Sections 2, 3 and 7: title, description, photo, list of badges.
// One accent colour paints both the decorative stars and the badges.
const textBlock = (name: string, title: string) =>
  section(name, title, [
    ...textFields('title', 'Заголовок'),
    ...textFields('description', 'Опис', 'text', {rows: 4}),
    imageField('image', 'Фото'),
    colorField('accentColor', 'Акцентний колір', 'Колір зірочок і фону бейджів.'),
    defineField({
      name: 'badges',
      title: 'Бейджі',
      type: 'array',
      validation: (rule) => rule.max(3).warning('У макеті не більше 3 бейджів'),
      of: [
        defineArrayMember({
          name: 'landingBadge',
          title: 'Бейдж',
          type: 'object',
          fields: textFields('text', 'Текст'),
          preview: {select: {title: 'text'}},
        }),
      ],
    }),
  ])

export const landing = defineField({
  name: 'landing',
  title: 'Лендінг товару',
  type: 'object',
  description:
    'Додаткові секції, які відображаються на сторінці товару після основного контенту. Порожні секції не показуються.',
  options: {collapsible: true, collapsed: true},
  fields: [
    section('hero', '1. Шапка (градієнт)', [
      defineField({
        name: 'label',
        title: 'Тип товару',
        type: 'string',
        description: 'Напис у куті шапки, наприклад Keyboard або Mouse.',
      }),
      defineField({name: 'model', title: 'Назва моделі', type: 'string'}),
      ...textFields('description', 'Опис моделі', 'text', {rows: 3}),
      imageField('image', 'Фото товару'),
      colorField('gradientFrom', 'Градієнт: початок'),
      colorField('gradientTo', 'Градієнт: кінець'),
      defineField({
        name: 'badges',
        title: 'Характеристики',
        type: 'array',
        validation: (rule) => rule.max(3).warning('У макеті не більше 3 характеристик'),
        of: [
          defineArrayMember({
            name: 'heroBadge',
            title: 'Характеристика',
            type: 'object',
            fields: [
              defineField({
                name: 'badge',
                title: 'Бейдж',
                type: 'string',
                description: 'Значення на бейджі, наприклад «1000 Гц».',
              }),
              ...textFields('text', 'Опис'),
            ],
            preview: {select: {title: 'badge', subtitle: 'text'}},
          }),
        ],
      }),
    ]),
    textBlock('textBlock1', '2. Текстовий блок'),
    textBlock('textBlock2', '3. Текстовий блок'),
    section('ribbon', '4. Градієнтна смуга', [
      colorField('gradientFrom', 'Градієнт: початок'),
      colorField('gradientTo', 'Градієнт: кінець'),
      defineField({
        name: 'badges',
        title: 'Бейджі',
        type: 'array',
        validation: (rule) => rule.max(2).warning('У макеті 2 бейджі'),
        of: [
          defineArrayMember({
            name: 'landingBadge',
            title: 'Бейдж',
            type: 'object',
            fields: textFields('text', 'Текст'),
            preview: {select: {title: 'text'}},
          }),
        ],
      }),
    ]),
    section('steps', '5. Нумерований список', [
      imageField('image', 'Фото'),
      defineField({
        name: 'items',
        title: 'Пункти',
        type: 'array',
        description: 'Нумерація 1–3 додається автоматично за порядком.',
        validation: (rule) => rule.max(3).warning('У макеті 3 пункти'),
        of: [
          defineArrayMember({
            name: 'step',
            title: 'Пункт',
            type: 'object',
            fields: [
              ...textFields('title', 'Заголовок'),
              ...textFields('description', 'Опис', 'text', {rows: 3}),
            ],
            preview: {select: {title: 'title', subtitle: 'description'}},
          }),
        ],
      }),
    ]),
    section('banner', '6. Фото на всю ширину', [imageField('image', 'Фото')]),
    textBlock('textBlock3', '7. Текстовий блок'),
    textBlock('textBlock4', '8. Текстовий блок'),
    section('faq', '9. Питання та відповіді', [
      defineField({
        name: 'items',
        title: 'Питання',
        type: 'array',
        of: [
          defineArrayMember({
            name: 'faqItem',
            title: 'Питання',
            type: 'object',
            fields: [
              ...textFields('question', 'Питання'),
              ...textFields('answer', 'Відповідь', 'text', {rows: 3}),
            ],
            preview: {select: {title: 'question', subtitle: 'answer'}},
          }),
        ],
      }),
    ]),
  ],
})
