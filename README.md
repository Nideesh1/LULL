# Lull

**A calm, curated dev feed for your Claude Code status line.** Lull shows one
genuinely useful thing — a sharp CLI tool, a piece of tech news — in your status
line, one item at a time. No doomscroll, no noise: a single tasteful line you can
⌘-click to open.

Works best in IDE / OSC-8 terminals (VS Code, iTerm2, Kitty, WezTerm, Ghostty).
The plain terminal CLI works too; the line still shows, clicks just need a
capable terminal.

## Install

```bash
npm install -g kapari-lull
kapari-lull init
```

`kapari-lull init` wires Lull into `~/.claude/settings.json` (backing it up
first). Install globally (above) so the `kapari-lull` command is on your PATH —
that's what the status line runs.

**or as a Claude Code plugin:**

```
/plugin marketplace add Nideesh1/LULL
/plugin install kapari-lull
/kapari-lull            # turn the status-line feed on
```

Open a new Claude Code session and watch the bottom row. ⌘-click an item
(Ctrl-click on Linux/Windows) to open it.

## Uninstall

```bash
kapari-lull uninstall          # remove Lull from your status line
npm uninstall -g kapari-lull   # remove the tool entirely
```

`kapari-lull uninstall` removes only what Lull added; the rest of your settings
is untouched (and a `settings.json.lull.bak` backup is kept just in case).

## How it works

```
Claude Code status line
   └─ runs `kapari-lull line` every few seconds (passes session JSON on stdin)
        └─ GET {LULL_SERVER}/feed  → one curated item (round-robin)
             └─ prints it as a clickable OSC 8 link  →  ⌘-click → opens the link
             └─ POST {LULL_SERVER}/event  → records an impression
```

- **The client is dumb:** it asks for one item and shows it. The server owns
  selection, so the feed can change without shipping a CLI update.
- **OSC 8 links** are clickable on capable terminals. `kapari-lull init` sets
  `FORCE_HYPERLINK=1` so clicks work even on terminals Claude Code doesn't
  allowlist (Ghostty, Warp, …).
- **If the server is unreachable**, `kapari-lull line` falls back to a small
  built-in dev feed (ripgrep, fzf, bat, zoxide) so the line is never empty and a
  dead server never breaks your status bar.

## Commands

| Command | Does |
|---|---|
| `kapari-lull init` | Wire Lull into `~/.claude/settings.json` (backs it up first) |
| `kapari-lull uninstall` | Remove Lull from your status line |
| `kapari-lull line` | Print one feed line (what the status line runs) |
| `kapari-lull serve [port]` | Run a legacy in-memory reference server locally |

## Run the feed server

The feed is served by the companion backend
[`AI_LULL_BACKEND`](https://github.com/Nideesh1/AI_LULL_BACKEND) — FastAPI +
Redis + MongoDB. Bring it up locally with Docker and point the client at it:

```bash
# in AI_LULL_BACKEND
docker compose up --build          # API on http://localhost:8990

# push a feed (admin-key protected)
curl -X POST localhost:8990/feed \
  -H "x-admin-key: <your key>" -H "content-type: application/json" \
  -d '{"items":[{"kind":"tool","title":"ripgrep — fast code search","url":"https://github.com/BurntSushi/ripgrep"}]}'
```

The client speaks that backend's API: `GET /feed` (one item) and
`POST /event` (`{item_id, type}` — `impression` or `click`).

> `kapari-lull serve` is a legacy in-memory ad/bid server kept for reference; the
> client now targets the `/feed` + `/event` API above.

## Configure

| Env | Default | Meaning |
|---|---|---|
| `LULL_SERVER` | `http://localhost:18990` | Feed server URL; unreachable → built-in dev-feed fill |
| `LULL_COMMAND` | `kapari-lull line` | Command `kapari-lull init` writes into settings |

## License

MIT.
