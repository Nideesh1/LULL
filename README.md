# Lull

**Get paid while you wait.** Simple status ads for Claude Code. Lull shows one
tasteful ad in your status line and shares the revenue with you, the developer
whose machine showed it.

Works best in IDE / OSC-8 terminals (VS Code, iTerm2, Kitty, WezTerm, Ghostty).
The terminal CLI works too; ads still show, clicks just need a capable terminal.
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
/kapari-lull            # turn the status-line ad on
```

Open a new Claude Code session and watch the bottom row. ⌘-click an ad
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
        └─ fetches one ad from the bid server (counts an impression)
             └─ prints it as a clickable OSC 8 link  →  ⌘-click → /click → advertiser
```

- **Impressions** are counted on every render — the base revenue (CPM), works
  in every terminal.
- **Clicks** are the premium tier — they need an OSC-8-capable terminal.
  `kapari-lull init` sets `FORCE_HYPERLINK=1` so clicks work even on terminals Claude
  Code doesn't allowlist.
- With **no server configured**, `kapari-lull line` falls back to built-in affiliate
  ads so the line is never empty and a dead server never breaks your status bar.

## Commands

| Command | Does |
|---|---|
| `kapari-lull init` | Wire Lull into `~/.claude/settings.json` (backs it up first) |
| `kapari-lull uninstall` | Remove Lull from your status line |
| `kapari-lull line` | Print one ad line (what the status line runs) |
| `kapari-lull serve [port]` | Run the ad / bid server locally |

## Run the server

```bash
kapari-lull serve                # http://localhost:8787
LULL_SERVER=http://localhost:8787 kapari-lull init   # point the client at it
```

Endpoints: `GET /ad`, `GET /click?id=`, `POST /bid`, `GET /leaderboard`.

Post a bid:

```bash
curl -X POST localhost:8787/bid -d '{"id":"acme","text":"Acme — ship faster","url":"https://acme.dev","bid_cpm":42}'
```

## Configure

| Env | Default | Meaning |
|---|---|---|
| `LULL_SERVER` | _(unset)_ | Ad server URL; unset → local affiliate fill |
| `LULL_COMMAND` | `kapari-lull line` | Command `kapari-lull init` writes into settings |
| `PORT` / `LULL_PUBLIC_URL` | `8787` | Server port / public base URL |

> Replace the `REPLACE_ME` affiliate codes in `src/ads.js` with your own.

## License

MIT.
