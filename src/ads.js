// Built-in fallback feed — a small set of genuinely useful dev tools shown when
// the feed server is unreachable, so the status line is never empty and a dead
// server never breaks your status bar. No ads, no affiliate codes: just a calm,
// curated dev feed.
export const FALLBACK_FEED = [
  { id: 'ripgrep', kind: 'opus', text: '[OPUS] ripgrep — blazing-fast recursive code search',  url: 'https://github.com/BurntSushi/ripgrep' },
  { id: 'fzf',     kind: 'opus', text: '[OPUS] fzf — fuzzy finder for your shell',             url: 'https://github.com/junegunn/fzf' },
  { id: 'bat',     kind: 'opus', text: '[OPUS] bat — a cat(1) clone with syntax highlighting', url: 'https://github.com/sharkdp/bat' },
  { id: 'zoxide',  kind: 'opus', text: '[OPUS] zoxide — a smarter cd that learns your dirs',   url: 'https://github.com/ajeetdsouza/zoxide' },
]

const ESC = '\x1b'
const DIM = `${ESC}[2m`, CYAN = `${ESC}[36m`, RESET = `${ESC}[0m`

// OSC 8 hyperlink — clickable in OSC-8-capable terminals. Note: Claude Code
// strips this unless FORCE_HYPERLINK=1 is set for terminals it doesn't
// allowlist (Ghostty, Warp, etc.). `lull init` sets that for you.
export function osc8(url, text) {
  return `${ESC}]8;;${url}${ESC}\\${text}${ESC}]8;;${ESC}\\`
}

// Render one feed item. `kind` (tool | news | …) becomes a small dim tag; the
// title is the clickable link. Accepts {kind, text, url} — backend items map
// their `title` field to `text` before calling this.
export function render(item) {
  const tag = item.kind || 'tip'
  const label = `${DIM}${tag}${RESET} ${CYAN}${item.text}${RESET}`
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
