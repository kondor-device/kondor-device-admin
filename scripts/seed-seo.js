/**
 * Fill empty SEO fields of categories and products with a basic template.
 * Existing values are never overwritten: only empty fields are set.
 * Products with "show on main page" enabled are skipped: they are tiles, not pages.
 *
 * Dry run (default, writes nothing):
 *   npx sanity exec scripts/seed-seo.js
 * Apply (uses the token of the logged-in Sanity CLI):
 *   APPLY=1 npx sanity exec scripts/seed-seo.js --with-user-token
 */
import {getCliClient} from 'sanity/cli'

const APPLY = process.env.APPLY === '1'
const client = getCliClient({apiVersion: '2025-11-11'})

const LIMITS = {title: 60, description: 160}

const TEXT = {
  uk: {
    suffix: '— купити',
    from: 'від Kondor Device',
    perks: 'Гарантія до 1 року, відправка в день замовлення, оплата після огляду.',
    categoryLead: 'Ігрові девайси преміум якості.',
  },
  ru: {
    suffix: '— купить',
    from: 'от Kondor Device',
    perks: 'Гарантия до 1 года, отправка в день заказа, оплата после осмотра.',
    categoryLead: 'Игровые девайсы премиум качества.',
  },
}

const clean = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '')
const isEmpty = (value) => !clean(value)

// "Мишка" + "Kondor Astra PRO" -> "Мишка Kondor Astra PRO"; skips the general name
// when the name already contains it (or when the two are the same words)
function productName(generalname, name) {
  const g = clean(generalname)
  const n = clean(name)
  if (!g) return n
  if (!n) return g
  return n.toLowerCase().includes(g.toLowerCase()) ? n : `${g} ${n}`
}

function fit(preferred, fallback, max) {
  return preferred.length <= max ? preferred : fallback.length <= max ? fallback : fallback
}

function itemSeo(item, lang) {
  const t = TEXT[lang]
  const ru = lang === 'ru'
  const base = productName(
    ru ? item.generalnameRu || item.generalname : item.generalname,
    ru ? item.nameRu || item.name : item.name,
  )
  return {
    title: fit(`${base} ${t.suffix}`, base, LIMITS.title),
    description: fit(`${base} ${t.from}. ${t.perks}`, `${base} ${t.from}.`, LIMITS.description),
  }
}

function categorySeo(category, lang) {
  const t = TEXT[lang]
  const name = clean(lang === 'ru' ? category.nameRu || category.name : category.name)
  return {
    title: fit(`${name} ${t.suffix}`, name, LIMITS.title),
    description: fit(
      `${name} ${t.from}. ${t.categoryLead} ${t.perks}`,
      `${name} ${t.from}. ${t.perks}`,
      LIMITS.description,
    ),
  }
}

async function main() {
  const [items, categories, drafts] = await Promise.all([
    client.fetch(`*[_type == "item" && showonmain != true]{
      _id, generalname, generalnameRu, name, nameRu,
      seoTitle, seoTitleRu, seoDescription, seoDescriptionRu
    } | order(name asc)`),
    client.fetch(`*[_type == "category"]{_id, name, nameRu, seo} | order(pos asc)`),
    client.fetch(`count(*[_id in path("drafts.**") && _type in ["item", "category"]])`),
  ])

  const patches = []
  const report = []

  for (const item of items) {
    const uk = itemSeo(item, 'uk')
    const ru = itemSeo(item, 'ru')
    const set = {}
    if (isEmpty(item.seoTitle)) set.seoTitle = uk.title
    if (isEmpty(item.seoTitleRu)) set.seoTitleRu = ru.title
    if (isEmpty(item.seoDescription)) set.seoDescription = uk.description
    if (isEmpty(item.seoDescriptionRu)) set.seoDescriptionRu = ru.description
    if (Object.keys(set).length) {
      patches.push({id: item._id, set})
      report.push({type: 'item', name: clean(item.name), ...set})
    }
  }

  for (const category of categories) {
    const uk = categorySeo(category, 'uk')
    const ru = categorySeo(category, 'ru')
    const seo = category.seo ?? {}
    const set = {}
    if (isEmpty(seo.metaTitle)) set['seo.metaTitle'] = uk.title
    if (isEmpty(seo.metaTitleRu)) set['seo.metaTitleRu'] = ru.title
    if (isEmpty(seo.metaDescription)) set['seo.metaDescription'] = uk.description
    if (isEmpty(seo.metaDescriptionRu)) set['seo.metaDescriptionRu'] = ru.description
    if (Object.keys(set).length) {
      patches.push({id: category._id, set, seoObject: true})
      report.push({type: 'category', name: clean(category.name), ...set})
    }
  }

  console.log(
    `${items.length} products, ${categories.length} categories, ${drafts} unpublished drafts`,
  )
  console.log(`${patches.length} documents to update${APPLY ? '' : ' (dry run)'}`)
  for (const row of report) console.log(JSON.stringify(row, null, 1))

  if (!APPLY) {
    console.log('\nDry run: nothing written. Re-run with APPLY=1 and --with-user-token to apply.')
  } else {
    let tx = client.transaction()
    for (const {id, set, seoObject} of patches) {
      tx = tx.patch(id, (p) => {
        if (seoObject) p = p.setIfMissing({seo: {_type: 'seoSettings'}})
        return p.set(set)
      })
    }
    const result = await tx.commit()
    console.log(`Updated ${result.results.length} documents`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
