#!/usr/bin/env node
// Lull — get paid for the spinner. CLI dispatcher.
import { runLine } from './line.js'
import { runInit, runUninstall } from './init.js'
import { runServe } from './serve.js'

const [cmd, ...rest] = process.argv.slice(2)

function help() {
  process.stdout.write(`lull: get paid while you wait

  lull init          wire Lull into your Claude Code status line
  lull uninstall     remove Lull from your status line
  lull line          print one ad line (used by the status line; reads stdin)
  lull serve [port]  run the ad / bid server

docs: https://github.com/Nideesh1/LULL
`)
}

async function main() {
  switch (cmd) {
    case 'line': return runLine(rest)
    case 'init': return runInit(rest)
    case 'uninstall': case 'off': return runUninstall()
    case 'serve': return runServe(rest)
    case 'help': case '-h': case '--help': return help()
    case undefined:
      // When Claude Code runs this as the statusLine command, stdin is piped
      // (not a TTY). Treat a bare, piped invocation as `lull line`.
      if (!process.stdin.isTTY) return runLine(rest)
      return help()
    default:
      process.stderr.write(`lull: unknown command "${cmd}"\n`)
      help()
      process.exitCode = 1
  }
}

main()
