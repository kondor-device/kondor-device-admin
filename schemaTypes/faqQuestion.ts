import {defineField, defineType} from 'sanity'
import {defineRuField} from './ruField'
import {faqAnswerPortableTextOf} from './blog/articlePortableText'
import {validateRuArray} from './blog/localeValidation'

/**
 * FAQ-питання — вбудований об'єкт (не окремий документ): кожна стаття
 * формує власний список у полі `customFaq`.
 */
export const faqQuestion = defineType({
  name: 'faqQuestion',
  title: 'FAQ — питання',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Питання',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineRuField({
      name: 'questionRu',
      title: 'Питання (RU)',
      type: 'string',
      ukField: 'question',
    }),
    defineField({
      name: 'answer',
      title: 'Відповідь',
      type: 'array',
      of: faqAnswerPortableTextOf,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'answerRu',
      title: 'Відповідь (RU)',
      type: 'array',
      of: faqAnswerPortableTextOf,
      description: 'Російська версія. Обов’язкова, якщо заповнена українська.',
      validation: (rule) =>
        rule.custom((value, context) => validateRuArray(value, context, 'answer')),
    }),
  ],
  preview: {
    select: {title: 'question'},
    prepare: ({title}) => ({title: title || 'Питання без заголовка', subtitle: 'FAQ'}),
  },
})
