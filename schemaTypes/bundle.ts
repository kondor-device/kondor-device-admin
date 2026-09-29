import {defineArrayMember, defineField, defineType} from 'sanity'
import {BundleColorInput} from './bundleColorInput'
import {defineRuField} from './ruField'

type BundleComponentValue = {item?: {_ref?: string}; colorCode?: string}

const priceOf = (item: {price?: number; priceDiscount?: number} | null | undefined) => {
  if (!item?.price) return 0
  return item.priceDiscount && item.priceDiscount < item.price ? item.priceDiscount : item.price
}

export const bundle = defineType({
  name: 'bundle',
  title: 'Сет',
  type: 'document',
  description:
    'Набір із 2–3 товарів фіксованої комплектації (з конкретними кольорами) за спільною ціною. Показується в категорії «Сети». Якщо хоча б одного компонента немає в наявності, сет зникає з сайту.',
  fields: [
    defineField({
      name: 'name',
      title: 'Назва сету',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineRuField({
      name: 'nameRu',
      title: 'Назва сету (RU)',
      type: 'string',
      ukField: 'name',
    }),
    defineField({
      name: 'slug',
      title: 'Slug (посилання)',
      type: 'string',
      description:
        'Унікальний ідентифікатор для URL. Не повинен збігатись зі slug жодного товару чи іншого сету.',
      validation: (rule) =>
        rule
          .required()
          .regex(/^[a-z0-9-]+$/)
          .custom(async (value, context) => {
            if (!value) return true

            const id = (context.document?._id ?? '').replace(/^drafts\./, '')
            const client = context.getClient({apiVersion: '2024-01-01'})
            const clash = await client.fetch<number>(
              `count(*[_type in ["item", "bundle"] && slug == $slug && !(_id in [$id, "drafts." + $id])])`,
              {slug: value, id},
            )

            return clash > 0 ? 'Такий slug уже використовується товаром або іншим сетом' : true
          }),
    }),
    defineField({
      name: 'components',
      title: 'Склад сету',
      type: 'array',
      description:
        'Від 2 до 3 товарів. Колір фіксований: клієнт його не обирає. Код кольору йде в CRM як sku, за ним списується склад.',
      of: [
        defineArrayMember({
          name: 'bundleComponent',
          title: 'Компонент',
          type: 'object',
          fields: [
            defineField({
              name: 'item',
              title: 'Товар',
              type: 'reference',
              to: [{type: 'item'}],
              description:
                'Лише справжні товари. Службові «товари» для посилань на головній сторінці (увімкнено «Показувати на головній») недоступні.',
              // Items with showonmain are banners for the home page, not products
              options: {filter: 'showonmain != true'},
              validation: (rule) =>
                rule.required().custom(async (value, context) => {
                  if (!value?._ref) return true

                  const client = context.getClient({apiVersion: '2024-01-01'})
                  const banner = await client.fetch<boolean>(
                    `coalesce(*[_id == "drafts." + $id][0].showonmain, *[_id == $id][0].showonmain, false)`,
                    {id: value._ref},
                  )

                  return banner
                    ? 'Це службовий елемент для головної сторінки, а не товар. Оберіть справжній товар'
                    : true
                }),
            }),
            defineField({
              name: 'colorCode',
              title: 'Колір (код варіанту)',
              type: 'string',
              components: {input: BundleColorInput},
              validation: (rule) =>
                rule.required().custom(async (value, context) => {
                  const itemRef = (context.parent as BundleComponentValue | undefined)?.item?._ref
                  if (!value || !itemRef) return true

                  const client = context.getClient({apiVersion: '2024-01-01'})
                  const codes = await client.fetch<string[]>(
                    `coalesce(*[_id == "drafts." + $id][0].coloropts, *[_id == $id][0].coloropts, [])[].code`,
                    {id: itemRef},
                  )

                  return (codes ?? []).includes(value)
                    ? true
                    : 'Цього коду немає серед колірних варіантів товару'
                }),
            }),
          ],
          preview: {
            select: {
              name: 'item.name',
              generalname: 'item.generalname',
              colorCode: 'colorCode',
              media: 'item.coloropts.0.photos.0',
            },
            prepare: ({name, generalname, colorCode, media}) => ({
              title: [generalname, name].filter(Boolean).join(' ') || 'Товар не обрано',
              subtitle: colorCode ? `Код кольору: ${colorCode}` : 'Колір не обрано',
              media,
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(3)
          .custom((value) => {
            const components = (value ?? []) as BundleComponentValue[]
            const keys = components
              .filter((component) => component.item?._ref && component.colorCode)
              .map((component) => `${component.item?._ref}:${component.colorCode}`)

            return new Set(keys).size === keys.length
              ? true
              : 'Один і той самий товар з тим самим кольором не можна додати двічі'
          }),
    }),
    defineField({
      name: 'bundlePrice',
      title: 'Ціна сету, ₴',
      type: 'number',
      description:
        'Ціна за весь сет. Економія (у % і в ₴) на сайті рахується автоматично: сума цін компонентів мінус ця ціна.',
      validation: (rule) => [
        rule.required().integer().min(1),
        rule
          .custom(async (value, context) => {
            const components = ((context.document?.components ?? []) as BundleComponentValue[])
              .map((component) => component.item?._ref)
              .filter(Boolean) as string[]

            if (!value || components.length === 0) return true

            const client = context.getClient({apiVersion: '2024-01-01'})
            const items = await client.fetch<
              {_id: string; price?: number; priceDiscount?: number}[]
            >(`*[_type == "item" && _id in $ids]{_id, price, priceDiscount}`, {ids: components})
            const byId = new Map(items.map((item) => [item._id, item]))
            const regularSum = components.reduce((sum, id) => sum + priceOf(byId.get(id)), 0)

            return regularSum > 0 && value >= regularSum
              ? `Ціна сету (${value} ₴) не менша за суму компонентів (${regularSum} ₴): економії не буде`
              : true
          })
          .warning(),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Опис',
      type: 'text',
      rows: 4,
      description: 'Короткий опис сету українською мовою.',
    }),
    defineRuField({
      name: 'descriptionRu',
      title: 'Опис (RU)',
      type: 'text',
      rows: 4,
      ukField: 'description',
    }),
    defineField({
      name: 'includeInFeed',
      title: 'Включити у товарні фіди',
      type: 'boolean',
      description:
        'Google, Meta, Rozetka. Поки вимкнено: використання цього поля додасться пізніше.',
      initialValue: false,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Мета-заголовок для сторінки сету.',
    }),
    defineRuField({
      name: 'seoTitleRu',
      title: 'SEO Title (RU)',
      type: 'string',
      ukField: 'seoTitle',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Мета-опис сторінки сету.',
    }),
    defineRuField({
      name: 'seoDescriptionRu',
      title: 'SEO Description (RU)',
      type: 'text',
      rows: 3,
      ukField: 'seoDescription',
    }),
    defineField({
      name: 'seoImage',
      title: 'SEO Зображення',
      type: 'image',
      description: 'Зображення для Open Graph. Якщо порожньо, береться фото першого компонента.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-текст',
          type: 'string',
          description: 'Опис зображення українською мовою.',
        }),
        defineRuField({
          name: 'altRu',
          title: 'Alt-текст (RU)',
          type: 'string',
          ukField: 'alt',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      price: 'bundlePrice',
      slug: 'slug',
      media: 'components.0.item.coloropts.0.photos.0',
    },
    prepare: ({title, price, slug, media}) => ({
      title,
      subtitle: [price ? `${price} ₴` : null, slug].filter(Boolean).join(' · '),
      media,
    }),
  },
})
