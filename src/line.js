import { FALLBACK_ADS, render, rotate } from './ads.js'

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
  const raw = await readStdin()
  let repo = ''
  try { repo = JSON.parse(raw)?.workspace?.repo?.name ?? '' } catch { /* ignore */ }

  const server = process.env.LULL_SERVER
  if (server) {
    try {
      const r = await fetch(
        `${server.replace(/\/$/, '')}/ad?repo=${encodeURIComponent(repo)}`,
        { signal: AbortSignal.timeout(1200) },
      )
      if (r.ok) {
        const line = await r.text()
        if (line) { process.stdout.write(line); return }
      }
    } catch { /* server down — fall through to local fill */ }
  }

  // Local affiliate fill — rotates every 8s, no server required. A dead server
  // must never break the status line.
  const ad = rotate(FALLBACK_ADS, 8)
  if (ad) process.stdout.write(render(ad))
}
