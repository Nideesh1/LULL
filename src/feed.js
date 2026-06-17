// Local fallback feed — shown only when the server is unreachable, so the
// status line is never empty even if AI_LULL_BACKEND is down. No ads, no
// affiliate codes — just a few perennially-useful dev tools.
export const FALLBACK_ITEMS = [
  { id: 'ripgrep', text: 'ripgrep — recursive grep that respects .gitignore', url: 'https://github.com/BurntSushi/ripgrep' },
  { id: 'fzf', text: 'fzf — a command-line fuzzy finder', url: 'https://github.com/junegunn/fzf' },
  { id: 'lazygit', text: 'lazygit — a simple terminal UI for git commands', url: 'https://github.com/jesseduffield/lazygit' },
  { id: 'house', text: 'Lull — a calm dev feed for your status line', url: 'https://github.com/Nideesh1/LULL' },
]

const ESC = '\x1b'
const CYAN = `${ESC}[36m`, DIM = `${ESC}[2m`, RESET = `${ESC}[0m`

// OSC 8 hyperlink — clickable in OSC-8-capable terminals. Note: Claude Code
// strips this unless FORCE_HYPERLINK=1 is set for terminals it doesn't
// allowlist (Ghostty, Warp, etc.). `lull init` sets that for you.
export function osc8(url, text) {
  return `${ESC}]8;;${url}${ESC}\\${text}${ESC}]8;;${ESC}\\`
}

export function render(item) {
  const label = `${CYAN}${item.text}${RESET}`
  if (!item.url) return label
  // Tell users every render how to open it.
  return `${osc8(item.url, label)}${DIM} command/ctrl-click${RESET}`
}

// Deterministic time-bucket rotation — changes every `seconds`, no state file.
export function rotate(list, seconds = 8) {
  if (!list.length) return null
  const i = Math.floor(Date.now() / (seconds * 1000)) % list.length
  return list[i]
}
