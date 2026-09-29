import type {StructureBuilder, StructureResolver} from 'sanity/structure'

// Типи, що не мають окремого пункту меню, крім груп нижче (щоб не дублювались у загальному списку)
const HIDDEN_TYPES = ['review']

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
    ])
