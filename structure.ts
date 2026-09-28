import type {StructureBuilder, StructureResolver} from 'sanity/structure'

// Типи, що не мають окремого пункту меню, крім груп нижче (щоб не дублювались у загальному списку)
const HIDDEN_TYPES = ['blogPost', 'blogAuthor', 'blogPage', 'review']

const reviewList = (S: StructureBuilder, title: string, status: string) =>
  S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(`Відгуки: ${title.toLowerCase()}`)
        .schemaType('review')
        .filter('_type == "review" && status == $status')
        .params({status})
        .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
    )

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Контент')
    .items([
      ...S.documentTypeListItems().filter(
        (listItem) => !HIDDEN_TYPES.includes(listItem.getId() ?? ''),
      ),
      S.divider(),
      S.listItem()
        .title('⭐ Відгуки')
        .child(
          S.list()
            .title('Відгуки')
            .items([
              reviewList(S, 'На модерації', 'pending'),
              reviewList(S, 'Схвалені', 'approved'),
              reviewList(S, 'Відхилені', 'rejected'),
            ]),
        ),
      S.listItem()
        .title('📰 Блог')
        .child(
          S.list()
            .title('Блог')
            .items([
              S.listItem()
                .title('Статті')
                .child(
                  S.documentTypeList('blogPost')
                    .title('Статті блогу')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Автори')
                .child(
                  S.documentTypeList('blogAuthor')
                    .title('Автори блогу')
                    .defaultOrdering([{field: 'name', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Сторінка «Блог» (SEO)')
                .child(
                  S.document()
                    .schemaType('blogPage')
                    .documentId('blogPage')
                    .title('Сторінка «Блог»'),
                ),
            ]),
        ),
    ])
