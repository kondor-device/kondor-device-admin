import {defineArrayMember, defineField, defineType} from 'sanity'

export const gallerySection = defineType({
  name: 'gallerySection',
  title: 'Галерея',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      type: 'array',
      title: 'Зображення',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'galleryItem',
          title: 'Елемент галереї',
          fields: [
            defineField({
              name: 'image',
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
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {image: 'image'},
            prepare: ({image}) => ({
              title: 'Елемент галереї',
              subtitle: image ? 'Зображення додано' : 'Без зображення',
              media: image,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {items: 'items'},
    prepare: ({items}) => ({
      title: 'Галерея',
      subtitle: `Зображень: ${Array.isArray(items) ? items.length : 0}`,
    }),
  },
})
