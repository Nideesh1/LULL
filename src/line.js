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

export async function runLine() {
  // Drain piped stdin (Claude Code streams session JSON) so we stay a well-behaved
  // pipe consumer; the /feed endpoint needs nothing from it.
  await readStdin()

  const server = process.env.LULL_SERVER
  if (server) {
    const base = server.replace(/\/$/, '')
    try {
      const r = await fetch(`${base}/feed`, {
        signal: AbortSignal.timeout(1200),
      })
      if (r.ok) {
        // Backend returns { item: {item_id, title, url, sponsor, ...}, items: [...] }.
        // It round-robins `item` server-side (Redis INCR) AND counts the
        // impression server-side before responding — this request alone is
        // the whole interaction. No follow-up POST /event: that second call
        // was the one place an impression could get lost if Claude Code
        // killed this short-lived process before it landed (it cancels an
        // in-flight statusLine run whenever a new render is triggered).
        // fromFeedItem() also rewrites the link to the backend's /click
        // redirect instead of item.url directly, so a later click — which
        // happens in the browser, long after this process has exited — still
        // gets counted; the backend logs it and 302s on to the real URL.
        const { item } = await r.json()
        const ad = fromFeedItem(item, base)
        if (ad) {
          process.stdout.write(render(ad))
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
