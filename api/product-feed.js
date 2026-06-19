// Vercel serverless function — Meta Catalog product feed
// Outputs all active products as CSV for Meta to fetch and sync into the catalog.
// Add this URL in Meta Commerce Manager → Catalog → Data Sources → Use feed URL.

const PROJECT_ID = 'queensonlinejewellery'
const API_KEY = 'AIzaSyAceC1Yz_rJ7H9T5Nt74P--TdhGayG7X-Q'
const BASE_URL = 'https://www.queensjewellery.co.in'
const BRAND = 'Queens Jewellery'

function extractField(fields, key) {
  const f = fields?.[key]
  if (!f) return null
  if (f.stringValue !== undefined) return f.stringValue
  if (f.integerValue !== undefined) return Number(f.integerValue)
  if (f.doubleValue !== undefined) return Number(f.doubleValue)
  if (f.booleanValue !== undefined) return f.booleanValue
  return null
}

function extractFirstImage(fields) {
  const mediaValues = fields.media?.arrayValue?.values
  if (!mediaValues?.length) return null
  // Prefer first image (not video)
  for (const item of mediaValues) {
    const m = item?.mapValue?.fields
    if (!m) continue
    const url = m.url?.stringValue
    const type = m.type?.stringValue
    if (url && type !== 'video') return url
  }
  return null
}

// CSV escape — wrap in quotes, escape internal quotes
function csv(value) {
  if (value === null || value === undefined) return ''
  const str = String(value).replace(/\r?\n/g, ' ').replace(/"/g, '""')
  return `"${str}"`
}

export default async function handler(req, res) {
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products?key=${API_KEY}&pageSize=300`
    const response = await fetch(firestoreUrl)

    if (!response.ok) {
      res.status(500).send('Failed to fetch products')
      return
    }

    const data = await response.json()
    const documents = data.documents || []

    // Meta Catalog columns — order matches Meta's official template
    const header = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'google_product_category',
      'sale_price',
    ].join(',')

    const rows = [header]

    const fmtPrice = (n) => `${Number(n).toFixed(2)} INR`

    for (const docu of documents) {
      const fields = docu.fields || {}
      const id = docu.name.split('/').pop()

      const active = extractField(fields, 'active')
      if (active === false) continue

      const name = extractField(fields, 'name')
      if (!name) continue

      const image = extractFirstImage(fields)
      if (!image) continue // Meta requires an image

      const price = extractField(fields, 'price') || 0
      const salePrice = extractField(fields, 'salePrice')
      const stock = extractField(fields, 'stock')
      const description = extractField(fields, 'description') || name

      // Availability: stock null/undefined = unlimited (in stock); 0 = out of stock
      const availability = stock === 0 ? 'out of stock' : 'in stock'

      const row = [
        csv(id),
        csv(name),
        csv(description.slice(0, 5000)),
        csv(availability),
        csv('new'),
        csv(fmtPrice(price)),
        csv(`${BASE_URL}/product/${id}`),
        csv(image),
        csv(BRAND),
        csv('Apparel & Accessories > Jewelry'),
        csv(salePrice ? fmtPrice(salePrice) : ''),
      ].join(',')

      rows.push(row)
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'inline; filename="product-feed.csv"')
    return res.send(rows.join('\n'))
  } catch (err) {
    console.error('product-feed error:', err)
    res.status(500).send('Error generating feed')
  }
}
