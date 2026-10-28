import type {SanityClient} from '@sanity/client'

export const REVIEW_STATUSES = ['pending', 'approved', 'hidden', 'rejected'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]
export type ReviewAction = 'publish' | 'hide' | 'reject' | 'undo'
export interface ReviewReply {
  text: string
  publishedAt?: string
  [key: string]: unknown
}
export interface ReviewRecord {
  _id: string
  _type: 'review'
  _rev: string
  item: {_ref: string}
  author: string
  phone?: string
  rating: number
  text: string
  status: ReviewStatus
  submittedAt: string
  reply?: ReviewReply | null
  itemName?: string
}
export interface EditorIdentity {
  id: string
  name: string
}
export interface ReviewState {
  text: string
  status: ReviewStatus
  reply: ReviewReply | null
}
export interface ReviewAudit {
  _id: string
  _type: 'reviewAudit'
  reviewId: string
  action: ReviewAction
  changedAt: string
  editor: EditorIdentity
  before: ReviewState
  after: ReviewState
  sourceRevision: string
}
export class ReviewConflictError extends Error {
  constructor() {
    super('Відгук уже змінився. Оновіть картку перед повторною дією.')
    this.name = 'ReviewConflictError'
  }
}
export const reviewState = (
  review: Pick<ReviewRecord, 'text' | 'status' | 'reply'>,
): ReviewState => ({
  text: review.text,
  status: review.status,
  reply: review.reply ?? null,
})
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  )
export function buildModerationPlan(
  current: ReviewRecord,
  action: ReviewAction,
  editor: EditorIdentity,
  auditId: string,
  changedAt: string,
  edits?: {text: string; replyText: string},
  undoAudit?: ReviewAudit,
) {
  if (current._type !== 'review' || !/^[a-zA-Z0-9_-]{1,128}$/.test(current._id) || !current._rev)
    throw new Error('Некоректний відгук')
  if (!REVIEW_STATUSES.includes(current.status)) throw new Error('Невідомий статус відгуку')
  if (!editor.id || !editor.name) throw new Error('Потрібна авторизація Sanity')
  if (!/^reviewAudit\.[a-zA-Z0-9_-]+$/.test(auditId))
    throw new Error('Журнал має зберігатися у приватному документі')
  if (!Number.isFinite(Date.parse(changedAt))) throw new Error('Некоректна дата зміни')
  const before = reviewState(current)
  let after: ReviewState = {...before}
  if (action === 'publish') {
    const text = edits?.text.trim() ?? current.text
    const replyText = edits?.replyText.trim() ?? current.reply?.text ?? ''
    if (!text || text.length > 5000 || replyText.length > 5000)
      throw new Error('Текст має містити від 1 до 5000 символів; відповідь — до 5000')
    after = {
      text,
      status: 'approved',
      reply: replyText
        ? ((replyText === current.reply?.text
            ? current.reply
            : {...current.reply, text: replyText, publishedAt: changedAt}) ?? null)
        : null,
    }
  } else if (action === 'hide') {
    if (current.status !== 'approved') throw new Error('Сховати можна лише опублікований відгук')
    after.status = 'hidden'
  } else if (action === 'reject') {
    if (current.status !== 'pending')
      throw new Error('Відхилити можна лише новий відгук; опублікований відгук можна сховати')
    after.status = 'rejected'
  } else if (action === 'undo') {
    if (
      !undoAudit ||
      undoAudit._type !== 'reviewAudit' ||
      undoAudit.reviewId !== current._id ||
      canonical(undoAudit.after) !== canonical(before)
    )
      throw new ReviewConflictError()
    if (
      !REVIEW_STATUSES.includes(undoAudit.before.status) ||
      typeof undoAudit.before.text !== 'string'
    )
      throw new Error('Некоректна історія змін')
    after = {...undoAudit.before}
  } else throw new Error('Невідома дія')
  if (canonical(before) === canonical(after)) throw new Error('Немає змін для збереження')
  const audit: ReviewAudit = {
    _id: auditId,
    _type: 'reviewAudit',
    reviewId: current._id,
    action,
    changedAt,
    editor,
    before,
    after,
    sourceRevision: current._rev,
  }
  const set: Record<string, unknown> = {text: after.text, status: after.status}
  if (after.reply) set.reply = after.reply
  return {
    audit,
    mutations: [
      {create: audit},
      {
        patch: {
          id: current._id,
          ifRevisionID: current._rev,
          set,
          ...(!after.reply ? {unset: ['reply']} : {}),
        },
      },
    ],
  }
}
export async function moderateReview(
  client: SanityClient,
  expected: ReviewRecord,
  action: ReviewAction,
  editor: EditorIdentity,
  edits?: {text: string; replyText: string},
  undoAudit?: ReviewAudit,
) {
  const config = client.config()
  if (config.projectId !== 'qmszlzqu' || config.dataset !== 'production')
    throw new Error('Неочікувана база даних')
  const current = await client.getDocument<ReviewRecord>(expected._id)
  if (!current || current._rev !== expected._rev) throw new ReviewConflictError()
  const plan = buildModerationPlan(
    current,
    action,
    editor,
    `reviewAudit.${crypto.randomUUID()}`,
    new Date().toISOString(),
    edits,
    undoAudit,
  )
  try {
    await client.mutate(plan.mutations, {visibility: 'sync', returnDocuments: false})
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 409)
      throw new ReviewConflictError()
    throw error
  }
  return plan.audit
}
