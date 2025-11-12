import {defineArrayMember, defineField, defineType} from 'sanity'

export const item = defineType({
  name: 'item',
  title: 'Товар',
  type: 'document',
  fields: [
    defineField({
      name: 'generalname',
      title: 'Загальна назва',
      type: 'string',
      description: 'Використовується для групування товарів. Має співпадати з полем у Dato CMS.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Назва товару',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Мета-заголовок для сторінки товару.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Мета-опис сторінки товару.',
    }),
    defineField({
      name: 'seoImage',
      title: 'SEO Зображення',
      type: 'image',
      description: 'Зображення для Open Graph. Використовуйте alt та url так само, як у Dato CMS.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-текст',
          type: 'string',
          description: 'Опис зображення українською мовою.',
        }),
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Slug (посилання)',
      type: 'string',
      description: 'Унікальний ідентифікатор для URL. Повинен бути таким самим, як у Dato CMS.',
      validation: (rule) => rule.required().regex(/^[a-z0-9-]+$/),
    }),
    defineField({
      name: 'price',
      title: 'Ціна',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'priceDiscount',
      title: 'Ціна зі знижкою',
      type: 'number',
      description: 'За відсутності знижки залишайте порожнім.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'description',
      title: 'Опис',
      type: 'text',
      rows: 4,
      description: 'Короткий опис товару українською мовою.',
    }),
    defineField({
      name: 'manual',
      title: 'Посилання на інструкцію',
      type: 'url',
      description: 'Повний URL до інструкції (PDF/Google Doc тощо).',
    }),
    defineField({
      name: 'driver',
      title: 'Посилання на драйвер',
      type: 'url',
      description: 'Повний URL до драйверів або додаткових файлів.',
    }),
    defineField({
      name: 'video',
      title: 'Відео',
      type: 'object',
      fields: [
        defineField({
          name: 'url',
          title: 'URL відео',
          type: 'url',
          description: 'Посилання на відео (YouTube, Vimeo тощо).',
        }),
      ],
    }),
    defineField({
      name: 'newItem',
      title: 'Новинка',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'badge',
      title: 'Бейдж',
      type: 'reference',
      to: [{type: 'badge'}],
      description: 'Оберіть один із заздалегідь створених бейджів для картки товару.',
      weak: true,
    }),
    defineField({
      name: 'showonaddons',
      title: 'Показувати як аксесуар',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'showonmain',
      title: 'Показувати на головній',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'preorder',
      title: 'Доступний до передзамовлення',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'preordertext',
      title: 'Текст передзамовлення',
      type: 'string',
      description: 'Пояснення для користувача, якщо товар доступний лише по передзамовленню.',
    }),
    defineField({
      name: 'chars',
      title: 'Характеристики',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'characteristic',
          title: 'Характеристика',
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Назва',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'char',
              title: 'Значення',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'coloropts',
      title: 'Колірні варіанти',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'colorOption',
          title: 'Варіант',
          type: 'object',
          fields: [
            defineField({
              name: 'code',
              title: 'Код',
              type: 'string',
              description: 'Внутрішній код варіанту.',
            }),
            defineField({
              name: 'color',
              title: 'Назва кольору',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'colorset',
              title: 'Набір кольорів',
              type: 'object',
              fields: [
                defineField({
                  name: 'hex',
                  title: 'HEX-код',
                  type: 'string',
                  description: 'Наприклад, #FFFFFF.',
                  validation: (rule) =>
                    rule.regex(/^#([0-9a-fA-F]{3}){1,2}$/).warning('Використовуйте формат HEX.'),
                }),
              ],
            }),
            defineField({
              name: 'photos',
              title: 'Фото',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'photo',
                  title: 'Фото',
                  type: 'image',
                  options: {hotspot: true},
                  fields: [
                    defineField({
                      name: 'alt',
                      title: 'Alt-текст',
                      type: 'string',
                      description: 'Опис фото українською мовою.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'complect',
      title: 'Комплектація',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'complectItem',
          title: 'Елемент комплектації',
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Назва',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Іконка',
              type: 'image',
              options: {hotspot: true},
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alt-текст',
                  type: 'string',
                  description: 'Опис іконки українською мовою.',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'cat',
      title: 'Категорія',
      type: 'reference',
      to: [{type: 'category'}],
      description: 'Основна категорія, до якої належить товар.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'slug',
      media: 'coloropts.0.photos.0',
    },
  },
})
