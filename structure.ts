import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import {SEO_SINGLETON_TYPES, SITE_SEO_PAGE_CONFIGS} from './schemaTypes/siteSeoPages'

// The usual list of documents, without the SEO singletons (they live in the «SEO» group).
// «SEO» — SEO settings of the static pages; each one is a single document with a fixed id.
export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Контент')
    .items([
      ...S.documentTypeListItems().filter(
        (item) => !SEO_SINGLETON_TYPES.includes(item.getId() ?? ''),
      ),
      S.divider(),
      S.listItem()
        .title('🔍 SEO сторінок')
        .child(
          S.list()
            .title('SEO сторінок')
            .items(
              SITE_SEO_PAGE_CONFIGS.map((page) =>
                S.listItem()
                  .title(page.title)
                  .id(page.name)
                  .child(
                    S.document().schemaType(page.name).documentId(page.name).title(page.title),
                  ),
              ),
            ),
        ),
    ])
