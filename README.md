# Lull

**A calm, curated dev feed for your status line.** Lull shows one tasteful
link in your Claude Code status line — an open-source tool, a bit of hot
tech news, occasionally a sponsored placement. One link, no doomscroll.

Works best in IDE / OSC-8 terminals (VS Code, iTerm2, Kitty, WezTerm, Ghostty).
The terminal CLI works too; items still show, clicks just need a capable terminal.
Sorry, terminal jockeys.

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
        └─ fetches ONE item from the feed server (round-robin), records an impression
             └─ prints it as a clickable OSC 8 link  →  ⌘-click → opens it directly
```

- **Impressions** are recorded on every render via `POST /event` — fire-and-forget,
  never blocks the status line.
- ⌘-click opens the item's URL directly. Click tracking isn't wired up yet.
- With **no server configured** (or one that's unreachable), `kapari-lull line`
  falls back to a few built-in, perennially-useful dev-tool tips, so the line
  is never empty and a dead server never breaks your status bar.

## Commands

| Command | Does |
|---|---|
| `kapari-lull init` | Wire Lull into `~/.claude/settings.json` (backs it up first) |
| `kapari-lull uninstall` | Remove Lull from your status line |
| `kapari-lull line` | Print one feed item (what the status line runs) |
| `kapari-lull serve [port]` | Legacy local test server — superseded by [AI_LULL_BACKEND](https://github.com/Nideesh1/AI_LULL_BACKEND) |

## Run your own feed server

The real feed server is [AI_LULL_BACKEND](https://github.com/Nideesh1/AI_LULL_BACKEND)
(FastAPI + Redis + MongoDB). Run it locally via `docker compose up` in that repo,
or point at a deployed instance:

```bash
LULL_SERVER=https://your-deployed-backend kapari-lull init
```

`kapari-lull init` currently defaults `LULL_SERVER` to `http://localhost:8990`
for local testing.

Endpoints: `GET /feed`, `POST /event`, `POST /feed` (admin, replaces the whole feed).

Push a feed item (admin key required):

```bash
curl -X POST localhost:8990/feed \
  -H "x-admin-key: <key>" -H "content-type: application/json" \
  -d '{"items":[{"kind":"tool","title":"ripgrep — fast code search","url":"https://github.com/BurntSushi/ripgrep"}]}'
```

## Configure

| Env | Default | Meaning |
|---|---|---|
| `LULL_SERVER` | `http://localhost:8990` (set by `init`) | Feed server URL; unreachable → local fallback tips |
| `LULL_COMMAND` | `kapari-lull line` | Command `kapari-lull init` writes into settings |
| `PORT` / `LULL_PUBLIC_URL` | `8787` | Legacy `kapari-lull serve` port / public base URL |

## License

MIT.
