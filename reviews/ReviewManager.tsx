import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient, useCurrentUser} from 'sanity'
import type {SanityClient} from '@sanity/client'
import {
  moderateReview,
  ReviewConflictError,
  type EditorIdentity,
  type ReviewAction,
  type ReviewAudit,
  type ReviewRecord,
} from './moderation'
import {HISTORY_QUERY, PRODUCTS_QUERY, REVIEW_QUERY, reviewListQuery} from './queries'
import {Buttons, Columns, Filters, List, Panel, Shell} from './styles'
import {refreshReviewSite} from './refreshSite'

const labels = {
  all: 'Усі',
  pending: 'На модерації',
  approved: 'Опубліковані',
  hidden: 'Сховані',
  rejected: 'Відхилені',
}
const actions = {
  publish: 'Публікація / редагування',
  hide: 'Приховування',
  reject: 'Відхилення',
  undo: 'Скасування зміни',
}
const date = (value: string) =>
  Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('uk-UA', {dateStyle: 'medium', timeZone: 'Europe/Kyiv'}).format(
        new Date(value),
      )
    : 'Дата не вказана'
interface Product {
  _id: string
  name: string
}
interface ReviewList {
  total: number
  counts: Record<string, number>
  reviews: ReviewRecord[]
}
export interface ManagerProps {
  client: SanityClient
  editor: EditorIdentity | null
  initialItemId?: string
}

// This component only receives the authenticated Studio client. It has no write token,
// public mutation endpoint, or access to product/order mutations.
export function ReviewManager({client, editor, initialItemId = 'all'}: ManagerProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [itemId, setItemId] = useState(initialItemId)
  const [status, setStatus] = useState<keyof typeof labels>('pending')
  const [search, setSearch] = useState('')
  const [querySearch, setQuerySearch] = useState('')
  const [page, setPage] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [list, setList] = useState<ReviewList>({total: 0, counts: {}, reviews: []})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [review, setReview] = useState<ReviewRecord | null>(null)
  const [history, setHistory] = useState<{recent: ReviewAudit[]; first: ReviewAudit | null}>({
    recent: [],
    first: null,
  })
  const [text, setText] = useState('')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retryAudit, setRetryAudit] = useState<string | null>(null)
  const detailRequest = useRef(0)
  const dirty = !!review && (text !== review.text || reply !== (review.reply?.text ?? ''))
  const canLeave = () => !dirty || window.confirm('Є незбережені зміни. Закрити їх без публікації?')
  useEffect(() => {
    if (initialItemId !== itemId) {
      setItemId(initialItemId)
      setPage(0)
      setSelected(null)
      setReview(null)
    }
    // Only external navigation changes the initial filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItemId])
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuerySearch(search.trim())
      setPage(0)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [search])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    let active = true
    client
      .fetch<Product[]>(PRODUCTS_QUERY)
      .then((result) => {
        if (active) setProducts(result)
      })
      .catch(() => {
        if (active) setError('Не вдалося завантажити товари. Перевірте доступ до Sanity.')
      })
    return () => {
      active = false
    }
  }, [client])
  useEffect(() => {
    let active = true
    setLoading(true)
    client
      .fetch<ReviewList>(reviewListQuery(page), {
        itemId,
        status,
        search: querySearch ? `${querySearch}*` : '',
      })
      .then((result) => {
        if (active) {
          setList(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setList({total: 0, counts: {}, reviews: []})
          setError('Не вдалося завантажити відгуки. Натисніть «Оновити».')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [client, itemId, status, querySearch, page, refresh])
  const loadReview = useCallback(
    async (id: string) => {
      const request = ++detailRequest.current
      setDetailLoading(true)
      setError('')
      try {
        const [doc, audit] = await Promise.all([
          client.fetch<ReviewRecord | null>(REVIEW_QUERY, {id}),
          client.fetch<{recent: ReviewAudit[]; first: ReviewAudit | null}>(HISTORY_QUERY, {id}),
        ])
        if (request !== detailRequest.current) return
        if (!doc) throw new Error('Відгук не знайдено')
        setReview(doc)
        setText(doc.text)
        setReply(doc.reply?.text ?? '')
        setHistory(audit)
      } catch {
        if (request === detailRequest.current)
          setError(
            'Не вдалося відкрити відгук або журнал. Перевірте права доступу та оновіть картку.',
          )
      } finally {
        if (request === detailRequest.current) setDetailLoading(false)
      }
    },
    [client],
  )
  useEffect(() => {
    if (selected) void loadReview(selected)
    else {
      ++detailRequest.current
      setReview(null)
      setDetailLoading(false)
    }
  }, [selected, loadReview])
  const filter = (callback: () => void) => {
    if (!busy && canLeave()) {
      callback()
      setPage(0)
      setSelected(null)
      setReview(null)
      setError('')
      setNotice('')
    }
  }
  const run = async (action: ReviewAction) => {
    if (!review || !editor || busy) return
    if (action !== 'publish' && dirty) {
      setError('Спочатку опублікуйте зміни тексту або оновіть картку, щоб їх скасувати.')
      return
    }
    if (
      action === 'undo' &&
      !window.confirm('Повернути текст, відповідь і статус до стану перед останньою зміною?')
    )
      return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const audit = await moderateReview(
        client,
        review,
        action,
        editor,
        action === 'publish' ? {text, replyText: reply} : undefined,
        history.recent[0],
      )
      setNotice('Зміни збережено.')
      setRefresh((n) => n + 1)
      setRetryAudit(audit._id)
      await loadReview(review._id)
      try {
        await refreshReviewSite(audit._id)
        setRetryAudit(null)
        setNotice('Зміни збережено. Відображення на сайті оновлено.')
      } catch {
        setNotice(
          'Зміни збережено в базі, але сайт ще не підтвердив оновлення. Повторіть оновлення кнопкою нижче. Повторно публікувати відгук не потрібно.',
        )
      }
    } catch (cause) {
      setError(
        cause instanceof ReviewConflictError
          ? cause.message
          : 'Зміни не збережено. Перевірте права публікації, інтернет і оновіть картку. Ваш текст залишився в редакторі.',
      )
    } finally {
      setBusy(false)
    }
  }
  const publishLabel =
    review?.status === 'approved'
      ? 'Зберегти та опублікувати'
      : review?.status === 'hidden'
        ? 'Відновити на сайті'
        : 'Схвалити та опублікувати'
  return (
    <Shell>
      <h1>Відгуки</h1>
      <p>Оберіть товар і статус. Текст на сайті зміниться лише після публікації.</p>
      <Filters>
        <label>
          Товар
          <select
            aria-label="Товар"
            value={itemId}
            disabled={busy}
            onChange={(e) => filter(() => setItemId(e.target.value))}
          >
            <option value="all">Усі товари</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Пошук за ім’ям або текстом
          <input
            type="search"
            maxLength={120}
            value={search}
            disabled={busy}
            onChange={(e) => {
              if (canLeave()) {
                setSearch(e.target.value)
                setSelected(null)
                setReview(null)
              }
            }}
          />
        </label>
        <button
          disabled={busy || loading}
          onClick={() => {
            setError('')
            setRefresh((n) => n + 1)
          }}
        >
          Оновити список
        </button>
      </Filters>
      <Buttons role="group" aria-label="Статус відгуків">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={status === key}
            disabled={busy}
            onClick={() => filter(() => setStatus(key as keyof typeof labels))}
          >
            {label}
            {key !== 'all' ? ` (${list.counts[key] ?? 0})` : ''}
          </button>
        ))}
      </Buttons>
      {error && <div role="alert">{error}</div>}
      {notice && <p role="status">{notice}</p>}
      {retryAudit && (
        <Buttons>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await refreshReviewSite(retryAudit)
                setRetryAudit(null)
                setNotice('Відображення на сайті оновлено.')
              } catch {
                setNotice(
                  'Не вдалося оновити сайт. Відгук уже збережено; перевірте з’єднання і повторіть пізніше.',
                )
              } finally {
                setBusy(false)
              }
            }}
          >
            Повторити оновлення сайту
          </button>
        </Buttons>
      )}
      <Columns>
        <section aria-label="Список відгуків" aria-busy={loading}>
          <p aria-live="polite">{loading ? 'Завантаження…' : `Знайдено: ${list.total}`}</p>
          {!loading && list.total === 0 && <p>За цими умовами відгуків немає.</p>}
          <List>
            {list.reviews.map((r) => (
              <li key={r._id}>
                <button
                  disabled={busy || loading}
                  aria-current={selected === r._id}
                  onClick={() => {
                    if (canLeave()) {
                      setSelected(r._id)
                      setNotice('')
                    }
                  }}
                >
                  <strong>
                    {r.author} · {'★'.repeat(Math.max(0, Math.min(5, r.rating)))}
                  </strong>
                  <small>
                    <span>{r.itemName}</span>
                    <span>{labels[r.status] ?? r.status}</span>
                  </small>
                  <p>{r.text}</p>
                  <time dateTime={r.submittedAt}>{date(r.submittedAt)}</time>
                </button>
              </li>
            ))}
          </List>
          <Buttons>
            <button
              disabled={busy || loading || page === 0}
              onClick={() => {
                if (canLeave()) {
                  setPage(page - 1)
                  setSelected(null)
                  setReview(null)
                }
              }}
            >
              Попередні
            </button>
            <span>
              Сторінка {page + 1} з {Math.max(1, Math.ceil(list.total / 30))}
            </span>
            <button
              disabled={busy || loading || (page + 1) * 30 >= list.total}
              onClick={() => {
                if (canLeave()) {
                  setPage(page + 1)
                  setSelected(null)
                  setReview(null)
                }
              }}
            >
              Наступні
            </button>
          </Buttons>
        </section>
        <Panel aria-label="Редагування відгуку" aria-busy={busy || detailLoading}>
          {detailLoading ? (
            <p>Завантаження відгуку…</p>
          ) : !review ? (
            <p>Оберіть відгук зі списку.</p>
          ) : (
            <>
              <h2>{review.author}</h2>
              <dl>
                <dt>Товар</dt>
                <dd>{review.itemName}</dd>
                <dt>Оцінка покупця</dt>
                <dd>{review.rating} / 5</dd>
                <dt>Дата відгуку</dt>
                <dd>{date(review.submittedAt)}</dd>
                <dt>Статус</dt>
                <dd>{labels[review.status] ?? review.status}</dd>
              </dl>
              <label>
                Текст відгуку
                <textarea
                  rows={7}
                  maxLength={5000}
                  value={text}
                  disabled={busy || !editor}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <small>
                Виправляйте лише формулювання, зберігаючи зміст і оцінку покупця. {text.length} /
                5000
              </small>
              <label>
                Відповідь Kondor
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={reply}
                  disabled={busy || !editor}
                  onChange={(e) => setReply(e.target.value)}
                />
              </label>
              <small>Порожнє поле прибере відповідь після публікації.</small>
              <Buttons>
                <button
                  data-primary="true"
                  disabled={
                    busy || !editor || !text.trim() || (review.status === 'approved' && !dirty)
                  }
                  onClick={() => void run('publish')}
                >
                  {busy ? 'Збереження…' : publishLabel}
                </button>
                {review.status === 'approved' && (
                  <button disabled={busy || !editor || dirty} onClick={() => void run('hide')}>
                    Сховати з сайту
                  </button>
                )}
                {review.status === 'pending' && (
                  <button disabled={busy || !editor || dirty} onClick={() => void run('reject')}>
                    Відхилити
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => {
                    if (canLeave()) void loadReview(review._id)
                  }}
                >
                  Оновити картку
                </button>
              </Buttons>
              {dirty && (
                <p role="status">
                  Є неопубліковані зміни. Поточний текст на сайті залишається без змін.
                </p>
              )}
              <details>
                <summary>Початковий текст</summary>
                <pre>{history.first?.before.text ?? review.text}</pre>
                <small>Стан до першої зміни через цей розділ.</small>
              </details>
              <details>
                <summary>
                  Історія змін ({history.recent.length}
                  {history.recent.length === 30 ? '+' : ''})
                </summary>
                {!history.recent.length && <p>Змін через цей розділ ще не було.</p>}
                {history.recent.map((a) => (
                  <section key={a._id}>
                    <p>
                      <strong>{actions[a.action]}</strong> · {a.editor.name} ·{' '}
                      {new Date(a.changedAt).toLocaleString('uk-UA', {timeZone: 'Europe/Kyiv'})}
                    </p>
                    <small>
                      {labels[a.before.status]} → {labels[a.after.status]}
                    </small>
                    <details>
                      <summary>Текст до зміни</summary>
                      <pre>{a.before.text}</pre>
                    </details>
                    <details>
                      <summary>Текст після зміни</summary>
                      <pre>{a.after.text}</pre>
                    </details>
                  </section>
                ))}
                {!!history.recent.length && (
                  <Buttons>
                    <button disabled={busy || !editor || dirty} onClick={() => void run('undo')}>
                      Скасувати останню зміну
                    </button>
                  </Buttons>
                )}
              </details>
            </>
          )}
        </Panel>
      </Columns>
    </Shell>
  )
}
export function StudioReviewManager({initialItemId}: {initialItemId?: string}) {
  const baseClient = useClient({apiVersion: '2025-11-11'})
  const client = useMemo(
    () => baseClient.withConfig({useCdn: false, perspective: 'raw'}),
    [baseClient],
  )
  const currentUser = useCurrentUser()
  const editor = currentUser ? {id: currentUser.id, name: currentUser.name || currentUser.id} : null
  return <ReviewManager client={client} editor={editor} initialItemId={initialItemId} />
}
