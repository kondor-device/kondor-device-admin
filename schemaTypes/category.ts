import {defineField, defineType} from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Категорія',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Назва категорії',
      type: 'string',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (посилання)',
      type: 'string',
      description: 'Унікальний ідентифікатор для URL. Повинен співпадати з версією у Dato CMS.',
      validation: (rule) => rule.required().regex(/^[a-z0-9-]+$/),
    }),
    defineField({
      name: 'pos',
      title: 'Порядковий номер (pos)',
      type: 'number',
      description: 'Використовується для сортування категорій.',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'image',
      title: 'Зображення',
      type: 'image',
      description: 'Основне зображення категорії. У фронтенді використовується alt та url.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-текст',
          type: 'string',
          description: 'Короткий опис зображення українською мовою.',
        }),
      ],
    }),
    defineField({
      name: 'items',
      title: 'Товари в категорії',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'item'}]}],
      description: 'Перелік товарів, що належать до цієї категорії.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      subtitle: 'slug',
    },
  },
})
