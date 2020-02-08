#!/usr/bin/env node

const split = require('split2')
const cli = require('@ianwalter/cli')
const pinoPrint = require('.')
const { print } = require('@ianwalter/print')

const config = cli({
  name: 'pino-print',
  usage: 'node server.js | pino-print [options]',
  options: {
    verbose: {
      alias: 'V',
      description: 'Output more request/response information',
      default: false
    },
    static: {
      alias: 's',
      description: `
        Specify a path that matches requests for static files so less
        information is logged for those requests/responses when in verbose mode
      `,
      default: '/static/'
    },
    ansi: {
      alias: 'a',
      description: `
        Enables ANSI escape sequences used to format output (via Chalk)
      `,
      default: true
    }
  }
})

if (config.help) {
  print.info(config.helpText)
} else {
  const prettifier = pinoPrint(config)
  process.stdin.pipe(split(prettifier)).pipe(process.stdout)
}

