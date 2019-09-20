#!/usr/bin/env node

const { print, chalk } = require('@ianwalter/print')
const split = require('split2')
const parseJson = require('fast-json-parse')

function pinoPrint (line) {
  if (line[0] === '{') {
    const {
      value: {
        // General log properties:
        level,
        time,
        msg,

        // Log properties specific to servers.
        req,
        res,
        responseTime,

        // Only included in debug levels:
        hostname,
        pid,

        // Ignored:
        v,

        // Everything else:
        ...rest
      }
    } = parseJson(line || {})

    const messages = []

    // Determine emoji/log type to use.
    let logType = 'log'
    if (req && res) {
      messages.push('📨')
    } else if (req) {
      messages.push('📥')
    } else if (res) {
      messages.push('📤')
    } else if (level < 30) {
      logType = 'debug'
    } else if (level === 30) {
      logType = 'info'
    }

    if (time) {
      const datetime = new Date(time)
      const [second, meridiem] = datetime.toLocaleTimeString().split(' ')
      const ms = datetime.getMilliseconds()
      const date = datetime.toLocaleDateString()
      messages.push(`${date} ${second}.${ms}${meridiem.toLowerCase()}`)
    }

    if (req && req.method) {
      messages.push(chalk.bold.yellow(req.method))
    }

    if (req && req.url) {
      messages.push(chalk.bold.yellow(req.url))
    }

    if (msg) {
      messages.push(chalk.bold.yellow(msg))
    }

    if (responseTime) {
      // FIXME: use timer to get a better formatted duration string.
      messages.push(chalk.bold.yellow(`in ${responseTime}ms`))
    }

    // Add back information if log level is debug.
    if (logType === 'debug') {
      rest.hostname = hostname
      rest.pid = pid
      rest.req = {
        id: req.id,
        headers: req.headers
      }
    }

    print[logType](...messages, ...Object.keys(rest).length ? [rest] : [])
  } else {
    print.text(line)
  }
}

process.stdin.pipe(split(pinoPrint))
