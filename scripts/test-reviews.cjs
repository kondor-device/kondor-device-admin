const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(file) {
  const module = {exports: {}}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    crypto: require('node:crypto').webcrypto,
    console,
    require,
  })
  return module.exports
}
const {
  buildModerationPlan: plan,
  moderateReview,
  ReviewConflictError,
} = load('reviews/moderation.ts')
const {reviewListQuery} = load('reviews/queries.ts')
const editor = {id: 'user-1', name: 'Manager'}
const source = {
  _id: 'review-1',
  _type: 'review',
  _rev: 'rev-1',
  item: {_ref: 'item-1'},
  author: 'Покупець',
  rating: 3,
  text: 'Початковий текст',
  status: 'approved',
  submittedAt: '2026-06-12T12:00:00Z',
  phone: 'private-test-value',
  reply: {text: 'Стара відповідь', publishedAt: '2026-06-13T12:00:00Z'},
}
const now = '2026-10-28T12:00:00Z'
const make = (record, action, edits, audit) =>
  plan(record, action, editor, 'reviewAudit.unique-test', now, edits, audit)
const plain = (value) => JSON.parse(JSON.stringify(value))
test('hide preserves original text and uses an atomic revision guard and private audit', () => {
  const result = make(source, 'hide')
  assert.equal(result.audit.before.text, source.text)
  assert.equal(result.audit.after.status, 'hidden')
  const patch = plain(result.mutations[1].patch)
  assert.equal(patch.ifRevisionID, 'rev-1')
  assert.equal(patch.set.text, source.text)
  for (const immutable of ['item', 'author', 'rating', 'phone', 'submittedAt'])
    assert.equal(Object.hasOwn(patch.set, immutable), false)
  assert.match(result.mutations[0].create._id, /^reviewAudit\./)
})
test('publish saves edits and store reply, retaining the source in the journal', () => {
  const result = make({...source, status: 'pending'}, 'publish', {
    text: '  Виправлений текст  ',
    replyText: ' Дякуємо! ',
  })
  assert.equal(result.audit.before.text, source.text)
  assert.equal(result.audit.after.text, 'Виправлений текст')
  assert.equal(result.audit.after.reply.text, 'Дякуємо!')
  assert.equal(result.audit.after.reply.publishedAt, now)
  assert.equal(result.audit.after.status, 'approved')
})
test('unchanged reply retains its original publication time', () => {
  assert.equal(
    make(source, 'publish', {text: 'Новий текст', replyText: source.reply.text}).audit.after.reply
      .publishedAt,
    source.reply.publishedAt,
  )
})
test('empty reply explicitly removes the old response', () => {
  const result = make(source, 'publish', {text: source.text, replyText: ''})
  assert.deepEqual(plain(result.mutations[1].patch.unset), ['reply'])
  assert.equal(result.audit.after.reply, null)
})
test('restore a hidden review without altering the rating or date', () =>
  assert.equal(make({...source, status: 'hidden'}, 'publish').audit.after.status, 'approved'))
test('reject pending and prevent accidental rejection of an approved review', () => {
  assert.equal(make({...source, status: 'pending'}, 'reject').audit.after.status, 'rejected')
  assert.throws(() => make(source, 'reject'))
  assert.throws(() => make({...source, status: 'pending'}, 'hide'))
})
test('undo restores before-state and records a new independent audit', () => {
  const first = make(source, 'hide')
  const hidden = {...source, status: 'hidden', _rev: 'rev-2'}
  const undo = make(hidden, 'undo', undefined, first.audit)
  assert.deepEqual(plain(undo.audit.after), plain(first.audit.before))
  assert.equal(undo.audit.action, 'undo')
  assert.equal(undo.mutations[1].patch.ifRevisionID, 'rev-2')
})
test('undo cannot overwrite a later reply or text from Telegram', () => {
  const first = make(source, 'hide')
  assert.throws(
    () =>
      make({...source, status: 'hidden', text: 'Інша нова правка'}, 'undo', undefined, first.audit),
    ReviewConflictError,
  )
})
test('undo is independent of object field ordering', () => {
  const first = make(source, 'hide')
  const current = {
    ...source,
    status: 'hidden',
    reply: {publishedAt: source.reply.publishedAt, text: source.reply.text},
  }
  assert.equal(make(current, 'undo', undefined, first.audit).audit.after.status, 'approved')
})
test('no-op does not generate spurious audit entries', () =>
  assert.throws(() => make(source, 'publish')))
test('reject empty or oversized text and oversized store replies', () => {
  for (const edits of [
    {text: ' ', replyText: ''},
    {text: 'x'.repeat(5001), replyText: ''},
    {text: 'okay', replyText: 'x'.repeat(5001)},
  ])
    assert.throws(() => make(source, 'publish', edits))
})
test('never mutate other document types or private draft/audit identifiers', () => {
  for (const record of [
    {...source, _type: 'item'},
    {...source, _id: 'drafts.review-1'},
    {...source, _id: 'reviewAudit.x'},
    {...source, status: 'unknown'},
  ])
    assert.throws(() => make(record, 'hide'))
})
test('actor required; audit IDs must stay non-public', () => {
  assert.throws(() => plan(source, 'hide', {id: '', name: ''}, 'reviewAudit.x', now))
  assert.throws(() => plan(source, 'hide', editor, 'public-audit', now))
})
test('stale editor snapshot is rejected before any mutation', async () => {
  let writes = 0
  const client = {
    config: () => ({projectId: 'qmszlzqu', dataset: 'production'}),
    getDocument: async () => ({...source, _rev: 'newer'}),
    mutate: async () => {
      writes++
    },
  }
  await assert.rejects(() => moderateReview(client, source, 'hide', editor), ReviewConflictError)
  assert.equal(writes, 0)
})
test('a race occurring after read is converted to a conflict without retrying writes', async () => {
  let writes = 0
  const client = {
    config: () => ({projectId: 'qmszlzqu', dataset: 'production'}),
    getDocument: async () => source,
    mutate: async () => {
      writes++
      throw {statusCode: 409}
    },
  }
  await assert.rejects(() => moderateReview(client, source, 'hide', editor), ReviewConflictError)
  assert.equal(writes, 1)
})
test('the tool cannot be used accidentally against another project or dataset', async () => {
  await assert.rejects(() =>
    moderateReview(
      {config: () => ({projectId: 'other', dataset: 'production'})},
      source,
      'hide',
      editor,
    ),
  )
})
test('pagination is bounded and GROQ filters remain parameterized', () => {
  assert.match(reviewListQuery(1), /\[30\.\.\.60\]/)
  for (const page of [-1, 1.5, Infinity, '0; delete']) assert.throws(() => reviewListQuery(page))
  assert.ok(reviewListQuery(0).includes('$search'))
  assert.ok(reviewListQuery(0).includes('$itemId'))
  assert.ok(reviewListQuery(0).includes('drafts.**'))
})
