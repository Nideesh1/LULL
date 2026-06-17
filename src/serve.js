import { createServer } from 'node:http'
import { FALLBACK_ADS } from './ads.js'

// Reference feed server — a zero-dependency, in-memory stand-in for
// AI_LULL_BACKEND that speaks the same GET /feed + POST /event contract, so you
// can develop the client without the full Mongo/Redis stack. In-memory only;
// production is the real backend.
export async function runServe(args) {
  const port = Number(process.env.PORT || args[0] || 8990)
  const publicUrl = (process.env.LULL_PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, '')

  // Seed the in-memory feed from the built-in affiliate inventory, in the
  // backend's FeedItem shape. make() also accepts backend-shaped items (title/
  // sponsor/ref_code) so POST /feed round-trips cleanly.
  let seq = 0
  const make = (a) => ({
    item_id: a.item_id || a.id || `it_${++seq}`,
    kind: a.kind || 'tool',
    title: a.title ?? a.text ?? '',
    url: a.url,
    sponsor: a.sponsor ?? a.brand ?? null,
    ref_code: a.ref_code ?? null,
    impressions: 0,
    clicks: 0,
  })
  let items = FALLBACK_ADS.map(make)
  let rr = 0

  // Public shape mirrors the backend's _serialize (no counters leaked).
  const serialize = (it) => ({
    item_id: it.item_id,
    kind: it.kind,
    title: it.title,
    url: it.url,
    sponsor: it.sponsor,
    ref_code: it.ref_code,
  })

  const json = (res, code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify(obj, null, 2))
  }
  const readBody = async (req) => { let b = ''; for await (const c of req) b += c; return b }

  const server = createServer(async (req, res) => {
    const u = new URL(req.url, publicUrl)

    if (u.pathname === '/health') return json(res, 200, { status: 'ok' })

    // Public. One round-robin `item` + the full `items` list (for client-side
    // caching). The cursor advances per call, like the backend's Redis INCR.
    if (u.pathname === '/feed' && req.method === 'GET') {
      if (!items.length) return json(res, 200, { item: null, items: [] })
      const it = items[rr++ % items.length]
      return json(res, 200, { item: serialize(it), items: items.map(serialize) })
    }

    // Public, fire-and-forget telemetry. Mirrors the backend: /feed only serves,
    // /event is what actually counts impressions/clicks.
    if (u.pathname === '/event' && req.method === 'POST') {
      try {
        const ev = JSON.parse(await readBody(req))
        if (ev.type !== 'impression' && ev.type !== 'click')
          return json(res, 400, { detail: 'type must be impression|click' })
        const it = items.find((x) => x.item_id === ev.item_id)
        if (it) it[ev.type === 'click' ? 'clicks' : 'impressions']++
        return json(res, 202, { accepted: true })
      } catch {
        return json(res, 400, { detail: 'invalid json' })
      }
    }

    // Replace the whole feed. The real backend gates this behind x-admin-key;
    // the local reference leaves it open for convenience.
    if (u.pathname === '/feed' && req.method === 'POST') {
      try {
        const body = JSON.parse(await readBody(req))
        const incoming = Array.isArray(body.items) ? body.items : []
        items = incoming.map(make)
        rr = 0
        return json(res, 200, { count: items.length })
      } catch {
        return json(res, 400, { detail: 'invalid json' })
      }
    }

    // Local-only debug view of the counters the backend's worker would persist.
    if (u.pathname === '/leaderboard') {
      return json(res, 200, items
        .map(({ item_id, title, sponsor, impressions, clicks }) =>
          ({ item_id, title, sponsor, impressions, clicks }))
        .sort((a, b) => b.impressions - a.impressions))
    }

    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
  })

  server.listen(port, () => {
    console.log(`lull serving on ${publicUrl}  (in-memory stand-in for AI_LULL_BACKEND)`)
    console.log(`  GET  /feed         → { item, items }  (round-robin)`)
    console.log(`  POST /event        → { item_id, type } impression|click  (202)`)
    console.log(`  POST /feed         → { items:[...] } replace the feed`)
    console.log(`  GET  /leaderboard  → counters (local debug)`)
    console.log(`\nPoint the client at it:  LULL_SERVER=${publicUrl} kapari-lull init`)
  })
}
