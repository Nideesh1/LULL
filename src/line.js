import { FALLBACK_FEED, render, rotate } from './ads.js'

// Default feed server. Overridable with LULL_SERVER. Out of the box the client
// pings the local Docker-compose backend; if it's unreachable we fall back to
// the built-in dev feed so the status line never breaks.
// (Deployed server: https://ai-lull-backend.pageapp.net — set LULL_SERVER to use it.)
const DEFAULT_SERVER = 'http://localhost:18990'

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

// Fire-and-forget impression. Bounded by a short timeout and swallows all
// errors — telemetry must never break or slow the status line.
async function recordEvent(server, itemId, type) {
  if (!itemId) return
  try {
    await fetch(`${server}/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, type }),
      signal: AbortSignal.timeout(1200),
    })
  } catch { /* ignore */ }
}

export async function runLine() {
  const raw = await readStdin()
  let repo = ''
  try { repo = JSON.parse(raw)?.workspace?.repo?.name ?? '' } catch { /* ignore */ }

  const server = (process.env.LULL_SERVER || DEFAULT_SERVER).replace(/\/$/, '')
  if (server) {
    try {
      const url = `${server}/feed${repo ? `?repo=${encodeURIComponent(repo)}` : ''}`
      const r = await fetch(url, { signal: AbortSignal.timeout(1200) })
      if (r.ok) {
        const item = (await r.json())?.item
        if (item?.title) {
          // Render first so the line shows immediately, then count the impression.
          process.stdout.write(render({ kind: item.kind, text: item.title, url: item.url }))
          await recordEvent(server, item.item_id, 'impression')
          return
        }
      }
    } catch { /* server down — fall through to local fill */ }
  }

  // Local feed fill — rotates every 8s, no server required. A dead server must
  // never leave the status line empty.
  const item = rotate(FALLBACK_FEED, 8)
  if (item) process.stdout.write(render(item))
}
