import { FALLBACK_ADS, render, rotate, fromFeedItem } from './ads.js'

// Read piped stdin (Claude Code streams session JSON) with a short timeout so
// the status line never hangs. Returns '' if nothing arrives.
function readStdin(timeoutMs = 60) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('')
    let data = ''
    const done = () => resolve(data)
    const t = setTimeout(done, timeoutMs)
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => { data += c })
    process.stdin.on('end', () => { clearTimeout(t); done() })
    process.stdin.on('error', () => { clearTimeout(t); done() })
  })
}

// Best-effort telemetry to the backend's POST /event. Bounded and swallows every
// error — a slow or dead server must never break or delay the status line.
async function reportEvent(server, itemId, type) {
  if (!server || !itemId) return
  try {
    await fetch(`${server.replace(/\/$/, '')}/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, type }),
      signal: AbortSignal.timeout(800),
    })
  } catch { /* telemetry is best-effort */ }
}

export async function runLine() {
  // Drain piped stdin (Claude Code streams session JSON) so we stay a well-behaved
  // pipe consumer; the /feed endpoint needs nothing from it.
  await readStdin()

  const server = process.env.LULL_SERVER
  if (server) {
    try {
      const r = await fetch(`${server.replace(/\/$/, '')}/feed`, {
        signal: AbortSignal.timeout(1200),
      })
      if (r.ok) {
        // Backend returns { item: {item_id, title, url, sponsor, ...}, items: [...] }.
        // It round-robins `item` server-side (Redis INCR) on every call.
        const { item } = await r.json()
        const ad = fromFeedItem(item)
        if (ad) {
          // Print first so the status line updates immediately, then count the
          // impression. Clicks can't be observed here — the terminal opens the URL
          // directly in a browser, out of this process's reach — so with this
          // backend we report impressions only.
          process.stdout.write(render(ad))
          await reportEvent(server, ad.id, 'impression')
          return
        }
      }
    } catch { /* server down or bad payload — fall through to local fill */ }
  }

  // Local affiliate fill — rotates every 8s, no server required. A dead server
  // must never break the status line.
  const ad = rotate(FALLBACK_ADS, 8)
  if (ad) process.stdout.write(render(ad))
}
