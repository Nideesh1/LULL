import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'

const SETTINGS = join(homedir(), '.claude', 'settings.json')

// The status-line command. We use the bare bin name (installed globally on PATH)
// rather than an absolute `node <path>` — Claude Code runs status-line commands
// through a bash-like shell, and on Windows the backslashes in an absolute path
// (C:\Users\...) get eaten, breaking it. A plain bin name has no backslashes.
const STATUS_COMMAND = 'kapari-lull line'

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

// Surgically remove only what Lull added — preserves everything else the user
// has in settings (safer than restoring a possibly-stale backup).
function removeLull(s) {
  delete s.statusLine
  if (s.env) {
    delete s.env.FORCE_HYPERLINK
    if (Object.keys(s.env).length === 0) delete s.env
  }
  return s
}

export async function runInit(args) {
  if (args.includes('--off')) return runUninstall()

  const s = load()
  const command = process.env.LULL_COMMAND || STATUS_COMMAND
  s.statusLine = { type: 'command', command, refreshInterval: 8, padding: 1 }

  // Force OSC 8 hyperlinks on so ads are clickable even on terminals Claude
  // Code doesn't allowlist (Ghostty, Warp, …). Harmless on capable terminals.
  s.env = { ...(s.env || {}), FORCE_HYPERLINK: '1' }

  save(s)

  console.log('✅ Lull is live.')
  console.log(`   settings: ${SETTINGS}  (backup: settings.json.lull.bak)`)
  console.log(`   statusLine → ${command}`)
  console.log('   ⌘-click an ad to open it (Ctrl-click on Linux/Windows).')
  console.log('   Open a NEW Claude Code session to see it.')
  console.log('   Remove any time:  kapari-lull uninstall')
}

export async function runUninstall() {
  const s = load()
  removeLull(s)
  save(s)

  console.log('✅ Lull removed from your status line.')
  console.log(`   settings: ${SETTINGS}  (backup: settings.json.lull.bak)`)
  console.log('   Remove the tool too:  npm uninstall -g kapari-lull')
  console.log('   Open a NEW Claude Code session.')
}
