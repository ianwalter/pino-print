#!/usr/bin/env node

const split = require('split2')
const cli = require('@ianwalter/cli')
const pinoPrint = require('.')

const config = cli({
  name: 'pino-print',
  usage: 'node server.js | pino-print [options]',
  options: {
    level: {
      alias: 'l',
      default: 'info'
    },
    ansi: {
      alias: 'a',
      default: true
    },
    static: {
      default: '/static/'
    }
  }
})
const prettifier = pinoPrint(config)

process.stdin.pipe(split(prettifier))
