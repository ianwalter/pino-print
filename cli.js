#!/usr/bin/env node

const split = require('split2')
const cli = require('@ianwalter/cli')
const stripAnsi = require('strip-ansi')
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

const print = new Print({ chalkEnabled: config.ansi })

function passthrough (line) {
  if (config.ansi) {
    print.write(line)
  } else {
    print.write(stripAnsi(line))
  }
}

process.stdin.pipe(split(pinoPrint))
