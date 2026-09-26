import {defineArrayMember} from 'sanity'

const linkAnnotation = {
  name: 'link',
  type: 'object',
  title: 'Посилання',
  fields: [
    {
      name: 'href',
      type: 'string',
      title: 'URL',
      validation: (rule: any) => rule.required(),
    },
    {
      name: 'blank',
      type: 'boolean',
      title: 'Відкривати в новій вкладці',
      initialValue: false,
    },
  ],
}

/**
 * Portable Text статей блогу — єдине джерело блоків.
 * Використовується і в українському (`content`), і в російському (`contentRu`) полі.
 */
export const articlePortableTextOf = [
  defineArrayMember({
    type: 'block',
    styles: [
      {title: 'Звичайний текст', value: 'normal'},
      {title: 'Заголовок H2', value: 'h2'},
      {title: 'Заголовок H3', value: 'h3'},
      {title: 'Заголовок H4', value: 'h4'},
    ],
    lists: [
      {title: 'Ненумерований список', value: 'bullet'},
      {title: 'Нумерований список', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Жирний', value: 'strong'},
        {title: 'Курсив', value: 'em'},
      ],
      annotations: [linkAnnotation],
    },
  }),
  defineArrayMember({
    type: 'image',
    title: 'Зображення',
    options: {hotspot: true},
    fields: [
      {
        name: 'alt',
        type: 'string',
        title: 'Альтернативний текст',
        description: 'Важливо для SEO та доступності',
      },
    ],
  }),
  defineArrayMember({type: 'table', title: 'Таблиця'}),
  defineArrayMember({type: 'gallerySection', title: 'Галерея'}),
  defineArrayMember({type: 'faqAnswerButton'}),
]

/** Обмежений Portable Text для відповідей FAQ: текст, список, посилання, кнопка. */
export const faqAnswerPortableTextOf = [
  defineArrayMember({
    type: 'block',
    styles: [{title: 'Звичайний текст', value: 'normal'}],
    lists: [{title: 'Ненумерований список', value: 'bullet'}],
    marks: {
      decorators: [
        {title: 'Жирний', value: 'strong'},
        {title: 'Курсив', value: 'em'},
      ],
      annotations: [linkAnnotation],
    },
  }),
  defineArrayMember({type: 'faqAnswerButton'}),
]
