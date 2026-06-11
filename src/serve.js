import { createServer } from 'node:http'
import { FALLBACK_ADS, render } from './ads.js'

// Reference ad / bid server. Affiliate fill is seeded as low house bids; real
// bids posted to /bid outrank them. In-memory only — production swaps the
// counting + payout for the private anti-fraud / Stripe module.
export async function runServe(args) {
  const port = Number(process.env.PORT || args[0] || 8787)
  const publicUrl = (process.env.LULL_PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, '')

  const ads = new Map()
  for (const a of FALLBACK_ADS) ads.set(a.id, { ...a, bid_cpm: 1, impressions: 0, clicks: 0 })

  const weight = (a) => Math.max(a.bid_cpm, 0.01)
  function pick() {
    const list = [...ads.values()]
    if (!list.length) return null
    const total = list.reduce((s, a) => s + weight(a), 0)
    let r = Math.random() * total
    for (const a of list) { r -= weight(a); if (r <= 0) return a }
    return list[list.length - 1]
  }

  function board() {
    return [...ads.values()]
      .sort((a, b) => b.bid_cpm - a.bid_cpm)
      .map(({ id, brand, text, bid_cpm, impressions, clicks }) => ({ id, brand, text, bid_cpm, impressions, clicks }))
  }

  const json = (res, code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify(obj, null, 2))
  }

  const server = createServer(async (req, res) => {
    const u = new URL(req.url, publicUrl)

    if (u.pathname === '/ad') {
      const a = pick()
      if (!a) { res.end(''); return }
      a.impressions++
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(render({ text: a.text, url: `${publicUrl}/click?id=${encodeURIComponent(a.id)}` }))
      return
    }

    if (u.pathname === '/click') {
      const a = ads.get(u.searchParams.get('id'))
      if (a) a.clicks++
      res.writeHead(302, { location: a?.url || 'https://github.com/Nideesh1/LULL' })
      res.end()
      return
    }

    if (u.pathname === '/bid' && req.method === 'POST') {
      let body = ''
      for await (const c of req) body += c
      try {
        const b = JSON.parse(body)
        if (!b.id || !b.text || !b.url) return json(res, 400, { error: 'id, text, url required' })
        ads.set(b.id, {
          id: b.id,
          text: String(b.text).slice(0, 60),
          url: b.url,
          brand: b.brand || '',
          bid_cpm: Number(b.bid_cpm) || 1,
          impressions: 0,
          clicks: 0,
        })
        return json(res, 200, { ok: true, leaderboard: board() })
      } catch {
        return json(res, 400, { error: 'invalid json' })
      }
    }

    if (u.pathname === '/leaderboard') return json(res, 200, board())

    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
  })

  server.listen(port, () => {
    console.log(`lull serving on ${publicUrl}`)
    console.log(`  GET  /ad?repo=     → one ad line (+1 impression)`)
    console.log(`  GET  /click?id=    → 302 to advertiser (+1 click)`)
    console.log(`  POST /bid          → add/replace an ad`)
    console.log(`  GET  /leaderboard  → ranking`)
    console.log(`\nPoint the client at it:  LULL_SERVER=${publicUrl} lull line`)
  })
}
