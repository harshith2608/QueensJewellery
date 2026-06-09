// Vercel serverless function — serves OG meta tags for product pages
// Called only for bot/crawler requests (WhatsApp, Facebook, Google etc.)
// Regular users are served the SPA as normal

const PROJECT_ID = 'queensonlinejewellery'
const API_KEY = 'AIzaSyAceC1Yz_rJ7H9T5Nt74P--TdhGayG7X-Q'
const BASE_URL = 'https://www.queensjewellery.co.in'

function extractField(fields, key) {
  const f = fields?.[key]
  if (!f) return null
  return (
    f.stringValue ??
    (f.integerValue != null ? Number(f.integerValue) : null) ??
    (f.doubleValue != null ? Number(f.doubleValue) : null) ??
    null
  )
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.redirect(302, BASE_URL)
  }

  const pageUrl = `${BASE_URL}/product/${id}`

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${id}?key=${API_KEY}`
    const response = await fetch(firestoreUrl)

    if (!response.ok) {
      return res.redirect(302, pageUrl)
    }

    const data = await response.json()
    const fields = data.fields || {}

    const name = extractField(fields, 'name') || 'Queens Jewellery'
    const rawDesc = extractField(fields, 'description') || 'Shop beautiful traditional and bridal jewellery at Queens Jewellery.'
    const description = rawDesc.slice(0, 200)
    const salePrice = extractField(fields, 'salePrice')
    const price = salePrice || extractField(fields, 'price')

    // Extract first media image URL
    let image = `${BASE_URL}/favicon.png`
    const mediaValues = fields.media?.arrayValue?.values
    if (mediaValues?.length > 0) {
      const firstUrl = mediaValues[0]?.mapValue?.fields?.url?.stringValue
      if (firstUrl) image = firstUrl
    }

    const title = escapeHtml(`${name} | Queens Jewellery`)
    const safeDesc = escapeHtml(description)
    const safeImage = escapeHtml(image)
    const priceLabel = price ? ` — ₹${price}` : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph (WhatsApp, Facebook, Instagram) -->
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="Queens Jewellery" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${safeDesc}${escapeHtml(priceLabel)}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="1067" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Redirect real browsers to the SPA -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
</head>
<body>
  <a href="${escapeHtml(pageUrl)}">View ${escapeHtml(name)} on Queens Jewellery</a>
  <script>window.location.replace("${escapeHtml(pageUrl)}")</script>
</body>
</html>`

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.send(html)
  } catch (err) {
    console.error('product-meta error:', err)
    return res.redirect(302, pageUrl)
  }
}
