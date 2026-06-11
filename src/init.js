import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SETTINGS = join(homedir(), '.claude', 'settings.json')

// Absolute path to this package's CLI. The status-line command points at this
// directly (`node <path> line`) so it works whether or not `lull` is on PATH —
// no global-bin assumption, no broken status bar for npx-only installs.
const CLI_PATH = fileURLToPath(new URL('./cli.js', import.meta.url))

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
  const command = process.env.LULL_COMMAND || `node ${JSON.stringify(CLI_PATH)} line`
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
  console.log('   Remove any time:  lull uninstall')
}

export async function runUninstall() {
  const s = load()
  removeLull(s)
  save(s)

  console.log('✅ Lull removed from your status line.')
  console.log(`   settings: ${SETTINGS}  (backup: settings.json.lull.bak)`)
  console.log('   Remove the tool too:  npm uninstall -g @kapari/lull')
  console.log('   Open a NEW Claude Code session.')
}
