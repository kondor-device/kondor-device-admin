import {defineField} from 'sanity'

type RuFieldOptions = {
  name: string
  title: string
  type: 'string' | 'text'
  // name of the Ukrainian sibling field (in the same object/document)
  ukField: string
  rows?: number
  description?: string
  // soft limit: shows a warning (does not block publishing)
  maxLength?: number
  fieldset?: string
}

const isFilled = (value: unknown) => typeof value === 'string' && value.trim().length > 0

// Russian translation field: required only when the Ukrainian sibling is filled.
// On the site an empty Russian value falls back to the Ukrainian one.
export const defineRuField = ({
  name,
  title,
  type,
  ukField,
  rows,
  description,
  maxLength,
  fieldset,
}: RuFieldOptions) =>
  defineField({
    name,
    title,
    type,
    ...(rows ? {rows} : {}),
    ...(fieldset ? {fieldset} : {}),
    description: description ?? 'Російська версія. Обов’язкова, якщо заповнена українська.',
    validation: (rule) => [
      rule.custom((value, context) => {
        const ukValue = (context.parent as Record<string, unknown> | undefined)?.[ukField]

        if (isFilled(ukValue) && !isFilled(value)) {
          return 'Заповніть російську версію (українська вже заповнена)'
        }

        return true
      }),
      ...(maxLength
        ? [rule.max(maxLength).warning(`Рекомендується не більше ${maxLength} символів`)]
        : []),
    ],
  })
