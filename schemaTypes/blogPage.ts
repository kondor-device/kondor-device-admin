import {defineField, defineType} from 'sanity'

// Синглтон: SEO сторінки списку статей (/blog)
export const blogPage = defineType({
  name: 'blogPage',
  title: 'Блог',
  type: 'document',
  fields: [defineField({name: 'seo', type: 'seoSettings', title: 'SEO блок'})],
  preview: {prepare: () => ({title: 'Блог', subtitle: 'Сторінка блогу'})},
})
