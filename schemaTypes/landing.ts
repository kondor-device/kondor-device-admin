import {defineArrayMember, defineField, type PreviewValue} from 'sanity'
import {defineRuField} from './ruField'

// «Лендінг товару»: шапка + конструктор з блоків, які сайт показує після основного контенту
// сторінки товару. Блоки можна додавати, видаляти та міняти місцями. Декор (лого, зірочки,
// нумерація, фон смуги) малюється на сайті, тут задаються лише тексти, фото та кольори.
// Порожній блок на сайті не виводиться.

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

const badgesField = defineField({
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
})

// Fields shared by the text blocks: title, description, photo, list of badges.
// One accent colour paints both the decorative stars and the badges.
const textBlockFields = () => [
  ...textFields('title', 'Заголовок'),
  ...textFields('description', 'Опис', 'text', {rows: 4}),
  imageField('image', 'Фото'),
  colorField('accentColor', 'Акцентний колір', 'Колір зірочок і фону бейджів.'),
  badgesField,
]

type BlockPreview = {
  select: Record<string, string>
  prepare: (selection: Record<string, PreviewValue['media'] & string>) => PreviewValue
}

// Preview of a text block: its title (or the block type when empty) and photo
const textBlockPreview = (label: string): BlockPreview => ({
  select: {title: 'title', media: 'image'},
  prepare: ({title, media}) => ({
    title: title || label,
    subtitle: title ? label : 'Порожній блок',
    media,
  }),
})

const block = (
  name: string,
  title: string,
  description: string,
  fields: ReturnType<typeof defineField>[],
  preview: BlockPreview,
) =>
  defineArrayMember({
    name,
    title,
    type: 'object',
    description,
    fields,
    preview,
  })

type Block = {_type?: string}

// Order rules for the builder: the ribbon cannot open the page, the FAQ is single and last
const validateBlocks = (blocks?: Block[]) => {
  if (!blocks || blocks.length === 0) return true

  if (blocks[0]._type === 'landingRibbon') {
    return 'Градієнтна смуга не може бути першим блоком'
  }

  const faqIndexes = blocks.flatMap((item, index) => (item._type === 'landingFaq' ? [index] : []))

  if (faqIndexes.length > 1) return 'Блок «Питання та відповіді» може бути лише один'
  if (faqIndexes.length === 1 && faqIndexes[0] !== blocks.length - 1) {
    return 'Блок «Питання та відповіді» має бути останнім'
  }

  return true
}

export const landing = defineField({
  name: 'landing',
  title: 'Лендінг товару',
  type: 'object',
  description:
    'Додаткові секції, які відображаються на сторінці товару після основного контенту. Порожні блоки не показуються.',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'hero',
      title: 'Шапка (градієнт)',
      type: 'object',
      description: 'Завжди перша на лендінгу.',
      options: {collapsible: true, collapsed: true},
      fields: [
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
      ],
    }),
    defineField({
      name: 'sections',
      title: 'Блоки',
      type: 'array',
      description:
        'Додавайте блоки кнопкою «Додати» та міняйте порядок перетягуванням. Блоки йдуть на сторінці після шапки в тому самому порядку.',
      validation: (rule) => rule.custom((value) => validateBlocks(value as Block[] | undefined)),
      of: [
        block(
          'landingTextPhoto',
          'Текст + фото (світлий)',
          'Світлий блок: текст ліворуч, фото праворуч.',
          [
            ...textBlockFields(),
            defineField({
              name: 'framed',
              title: 'Фото в рамці',
              type: 'boolean',
              description: 'Фото із заокругленими кутами, ширше за звичайне (напр. скріншот програми).',
              initialValue: false,
            }),
            defineField({
              name: 'badgesUnderImage',
              title: 'Бейджі під фото',
              type: 'boolean',
              description: 'Показати бейджі під фото, а не під текстом.',
              initialValue: false,
            }),
          ],
          textBlockPreview('Текст + фото'),
        ),
        block(
          'landingDarkCard',
          'Темна картка (фото ліворуч)',
          'Темний блок із закругленими кутами: фото виходить за лівий край, текст праворуч.',
          textBlockFields(),
          textBlockPreview('Темна картка'),
        ),
        block(
          'landingSquarePhoto',
          'Фото на темному квадраті',
          'Світлий блок: фото на темному квадраті ліворуч, текст праворуч.',
          textBlockFields(),
          textBlockPreview('Фото на квадраті'),
        ),
        block(
          'landingRibbon',
          'Градієнтна смуга',
          'Смуга з 1–2 білими бейджами.',
          [
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
          ],
          {
            select: {first: 'badges.0.text', second: 'badges.1.text'},
            prepare: ({first, second}) => ({
              title: [first, second].filter(Boolean).join(' • ') || 'Градієнтна смуга',
              subtitle: 'Градієнтна смуга',
            }),
          },
        ),
        block(
          'landingSteps',
          'Нумерований список',
          'Пункти 1–3 з фото праворуч. Нумерація додається автоматично.',
          [
            imageField('image', 'Фото'),
            defineField({
              name: 'items',
              title: 'Пункти',
              type: 'array',
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
          ],
          {
            select: {first: 'items.0.title', media: 'image'},
            prepare: ({first, media}) => ({
              title: first || 'Нумерований список',
              subtitle: 'Нумерований список',
              media,
            }),
          },
        ),
        block(
          'landingBanner',
          'Фото на всю ширину',
          'Велике фото без тексту.',
          [imageField('image', 'Фото')],
          {
            select: {media: 'image'},
            prepare: ({media}) => ({
              title: 'Фото на всю ширину',
              media,
            }),
          },
        ),
        block(
          'landingFaq',
          'Питання та відповіді',
          'Акордеон з питань і відповідей. Може бути лише один і має йти останнім.',
          [
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
          ],
          {
            select: {first: 'items.0.question'},
            prepare: ({first}) => ({
              title: 'Питання та відповіді',
              subtitle: first,
            }),
          },
        ),
      ],
    }),
  ],
})
