// Built-in fallback inventory ("house ads", affiliate links). Shown when no
// server is configured, and used as the always-available fill behind the bid
// market so the status line is never empty.
//
// NOTE: replace the REPLACE_ME ref codes with your real affiliate codes.
export const FALLBACK_ADS = [
  { id: 'do',     text: 'DigitalOcean — $200 in free credit',        url: 'https://www.digitalocean.com/?refcode=REPLACE_ME', brand: 'DigitalOcean' },
  { id: 'vultr',  text: 'Vultr — cloud compute from $2.50/mo',       url: 'https://www.vultr.com/?ref=REPLACE_ME',            brand: 'Vultr' },
  { id: 'ncheap', text: 'Namecheap — domains from $5.98',            url: 'https://namecheap.pxf.io/REPLACE_ME',              brand: 'Namecheap' },
  { id: 'house',  text: 'Your ad here. Get paid while you wait.',     url: 'https://github.com/Nideesh1/LULL',                 brand: 'Lull' },
]

const ESC = '\x1b'
const DIM = `${ESC}[2m`, CYAN = `${ESC}[36m`, RESET = `${ESC}[0m`

// OSC 8 hyperlink — clickable in OSC-8-capable terminals. Note: Claude Code
// strips this unless FORCE_HYPERLINK=1 is set for terminals it doesn't
// allowlist (Ghostty, Warp, etc.). `lull init` sets that for you.
export function osc8(url, text) {
  return `${ESC}]8;;${url}${ESC}\\${text}${ESC}]8;;${ESC}\\`
}

export function render(ad) {
  const label = `${DIM}ad${RESET} ${CYAN}${ad.text}${RESET}`
  if (!ad.url) return label
  // Tell users every render how to open it.
  return `${osc8(ad.url, label)}${DIM} command/ctrl-click${RESET}`
}

// Deterministic time-bucket rotation — changes every `seconds`, no state file.
export function rotate(list, seconds = 8) {
  if (!list.length) return null
  const i = Math.floor(Date.now() / (seconds * 1000)) % list.length
  return list[i]
}
