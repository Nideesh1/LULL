import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'

const SETTINGS = join(homedir(), '.claude', 'settings.json')

function load() {
  if (!existsSync(SETTINGS)) return {}
  try {
    return JSON.parse(readFileSync(SETTINGS, 'utf8'))
  } catch {
    console.error(`✋ ${SETTINGS} isn't valid JSON — fix it and re-run.`)
    process.exit(1)
  }
}

function save(obj) {
  mkdirSync(dirname(SETTINGS), { recursive: true })
  if (existsSync(SETTINGS)) copyFileSync(SETTINGS, `${SETTINGS}.lull.bak`)
  writeFileSync(SETTINGS, `${JSON.stringify(obj, null, 2)}\n`)
}

export async function runInit(args) {
  const off = args.includes('--off')
  const s = load()

  if (off) {
    delete s.statusLine
    if (s.env) delete s.env.FORCE_HYPERLINK
    save(s)
    console.log('✅ Lull removed from your status line. Open a new session.')
    return
  }

  // `lull line` resolves via PATH (npm global / npm link / plugin bin/).
  const command = process.env.LULL_COMMAND || 'lull line'
  s.statusLine = { type: 'command', command, refreshInterval: 8, padding: 1 }

  // Force OSC 8 hyperlinks on so ads are ⌘-clickable even on terminals Claude
  // Code doesn't allowlist (Ghostty, Warp, …). Harmless on capable terminals.
  s.env = { ...(s.env || {}), FORCE_HYPERLINK: '1' }

  save(s)

  console.log('✅ Lull is live.')
  console.log(`   settings: ${SETTINGS}  (backup: settings.json.lull.bak)`)
  console.log(`   statusLine → "${command}"`)
  console.log('   ⌘-click an ad to open it (Ctrl-click on Linux/Windows).')
  console.log('   Open a NEW Claude Code session to see it.')
}
