export async function refreshReviewSite(auditId: string) {
  const site = process.env.SANITY_STUDIO_REVIEW_SITE_URL || 'https://www.kondor.ua'
  const url = new URL(site)
  if (
    url.protocol !== 'https:' ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    !(
      url.hostname === 'www.kondor.ua' ||
      /^kondor-device-frontend-[a-z0-9-]+-kondor-devices-projects\.vercel\.app$/.test(url.hostname)
    )
  )
    throw new Error('Некоректна адреса сайту')
  const response = await fetch(new URL('/api/reviews/revalidate', url), {
    method: 'POST',
    credentials: 'omit',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({auditId}),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('Не вдалося оновити відображення на сайті')
}
