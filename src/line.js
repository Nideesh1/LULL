import { FALLBACK_ITEMS, render, rotate } from './feed.js'

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

// Fire-and-forget impression ping — never awaited by the caller. A slow or
// dead server must not hold up the line.
function recordImpression(base, item_id) {
  fetch(`${base}/event`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ item_id, type: 'impression' }),
    signal: AbortSignal.timeout(1200),
  }).catch(() => {})
}

export async function runLine() {
  const raw = await readStdin()
  let repo = ''
  try { repo = JSON.parse(raw)?.workspace?.repo?.name ?? '' } catch { /* ignore */ }

  const server = process.env.LULL_SERVER
  if (server) {
    const base = server.replace(/\/$/, '')
    try {
      const r = await fetch(`${base}/feed?repo=${encodeURIComponent(repo)}`, {
        signal: AbortSignal.timeout(1200),
      })
      if (r.ok) {
        const { item } = await r.json()
        if (item?.title) {
          recordImpression(base, item.item_id)
          process.stdout.write(render({ text: item.title, url: item.url }))
          return
        }
      }
    } catch { /* server down — fall through to local fill */ }
  }

  // Local fill — rotates every 8s, no server required. A dead server must
  // never leave the status line empty.
  const item = rotate(FALLBACK_ITEMS, 8)
  if (item) process.stdout.write(render(item))
}
