/**
 * Fills the Russian fields (`*Ru`) of existing documents from a dictionary.
 *
 * The dictionary (scripts/ru-translations.json) maps an exact Ukrainian string to its
 * Russian translation. Strings without Cyrillic letters (numbers, latin names) are copied as is.
 * Only EMPTY Russian fields are filled, so the script is idempotent and never overwrites
 * translations edited in Studio.
 *
 * Usage (from kondor-device-admin):
 *   node scripts/migrate-ru.mjs --extract   # add new Ukrainian strings to the dictionary (read-only)
 *   node scripts/migrate-ru.mjs             # dry run: show what would be changed (read-only)
 *   SANITY_WRITE_TOKEN=... node scripts/migrate-ru.mjs --apply
 *   npx sanity exec scripts/migrate-ru.mjs --with-user-token -- --apply   # uses the CLI login
 *
 * Make a backup before applying:  npx sanity dataset export production backup.tar.gz
 */
import {createClient} from '@sanity/client'
import {readFileSync, writeFileSync, existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'

const DICTIONARY_PATH = join(dirname(fileURLToPath(import.meta.url)), 'ru-translations.json')
const args = new Set(process.argv.slice(2))
const isApply = args.has('--apply')
const isExtract = args.has('--extract')

const clientConfig = {
  projectId: 'qmszlzqu',
  dataset: 'production',
  apiVersion: '2025-11-11',
  useCdn: false,
}

// Under `sanity exec --with-user-token` the client is authorized with the logged-in CLI user,
// otherwise a token from SANITY_WRITE_TOKEN is used (write access is only needed for --apply)
const isSanityExec = Boolean(process.env.SANITY_BASE_PATH)
const client = isSanityExec
  ? (await import('sanity/cli')).default.getCliClient(clientConfig)
  : createClient({...clientConfig, token: process.env.SANITY_WRITE_TOKEN})
const hasWriteToken = isSanityExec || Boolean(process.env.SANITY_WRITE_TOKEN)

const dictionary = existsSync(DICTIONARY_PATH)
  ? JSON.parse(readFileSync(DICTIONARY_PATH, 'utf8'))
  : {}

const hasCyrillic = (value) => /[А-Яа-яІіЇїЄєҐґЁё]/.test(value)
const isFilled = (value) => typeof value === 'string' && value.trim().length > 0

// Translation for a Ukrainian string, or undefined when it is missing from the dictionary
const translate = (uk) => {
  if (!hasCyrillic(uk)) return uk.trim()
  const ru = dictionary[uk]
  return isFilled(ru) ? ru.trim() : undefined
}

const docs = await client.fetch(`*[_type in ["item", "category", "badge"]]`)

const missing = new Set()
const patches = []

for (const doc of docs) {
  const set = {}

  // Adds `${path}` = translation of `source[ukKey]` when the Russian field is empty
  const fill = (source, ukKey, ruKey, path) => {
    const uk = source?.[ukKey]
    if (!isFilled(uk) || isFilled(source?.[ruKey])) return

    const ru = translate(uk)
    if (ru === undefined) {
      missing.add(uk)
      return
    }
    set[path] = ru
  }

  const fields =
    doc._type === 'item'
      ? [
          ['generalname', 'generalnameRu'],
          ['name', 'nameRu'],
          ['seoTitle', 'seoTitleRu'],
          ['seoDescription', 'seoDescriptionRu'],
          ['description', 'descriptionRu'],
          ['preordertext', 'preordertextRu'],
        ]
      : doc._type === 'category'
        ? [['name', 'nameRu']]
        : [['text', 'textRu']]

  for (const [uk, ru] of fields) fill(doc, uk, ru, ru)

  fill(doc.image, 'alt', 'altRu', 'image.altRu')
  fill(doc.seoImage, 'alt', 'altRu', 'seoImage.altRu')

  for (const option of doc.coloropts ?? []) {
    const base = `coloropts[_key=="${option._key}"]`
    fill(option, 'color', 'colorRu', `${base}.colorRu`)
    for (const photo of option.photos ?? []) {
      fill(photo, 'alt', 'altRu', `${base}.photos[_key=="${photo._key}"].altRu`)
    }
  }

  for (const char of doc.chars ?? []) {
    const base = `chars[_key=="${char._key}"]`
    fill(char, 'name', 'nameRu', `${base}.nameRu`)
    fill(char, 'char', 'charRu', `${base}.charRu`)
  }

  for (const item of doc.complect ?? []) {
    const base = `complect[_key=="${item._key}"]`
    fill(item, 'name', 'nameRu', `${base}.nameRu`)
    fill(item.icon, 'alt', 'altRu', `${base}.icon.altRu`)
  }

  if (Object.keys(set).length > 0) patches.push({id: doc._id, type: doc._type, set})
}

if (isExtract) {
  let added = 0
  for (const uk of missing) {
    dictionary[uk] = ''
    added++
  }
  writeFileSync(DICTIONARY_PATH, `${JSON.stringify(dictionary, null, 2)}\n`)
  console.log(`Added ${added} new Ukrainian strings to ${DICTIONARY_PATH}`)
  process.exit(0)
}

const fieldsToSet = patches.reduce((sum, p) => sum + Object.keys(p.set).length, 0)
console.log(
  `Documents: ${docs.length}, to patch: ${patches.length}, fields to fill: ${fieldsToSet}`,
)

if (missing.size > 0) {
  console.log(`\nMissing translations (${missing.size}), these fields are skipped:`)
  for (const uk of missing)
    console.log(`  - ${JSON.stringify(uk.length > 90 ? `${uk.slice(0, 90)}…` : uk)}`)
  console.log('Run with --extract, fill the dictionary and run again.')
}

if (!isApply) {
  console.log('\nDry run. Nothing was written. Use --apply (with SANITY_WRITE_TOKEN) to write.')
  process.exit(0)
}

if (!hasWriteToken) {
  console.error('\nSANITY_WRITE_TOKEN (or sanity exec --with-user-token) is required for --apply')
  process.exit(1)
}

// Publish-safe: only `set` on the Russian fields, in small transactions
const BATCH_SIZE = 10
for (let i = 0; i < patches.length; i += BATCH_SIZE) {
  const transaction = client.transaction()
  for (const {id, set} of patches.slice(i, i + BATCH_SIZE)) transaction.patch(id, (p) => p.set(set))
  await transaction.commit()
  console.log(`Patched ${Math.min(i + BATCH_SIZE, patches.length)}/${patches.length}`)
}

console.log('\nDone.')
