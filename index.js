#!/usr/bin/env node

const { Print, chalk } = require('@ianwalter/print')
const split = require('split2')
const parseJson = require('fast-json-parse')
const cli = require('@ianwalter/cli')
const stripAnsi = require('strip-ansi')

const config = cli({
  name: 'pino-print',
  opts: {
    alias: {
      level: 'l',
      ansi: 'a'
    },
    boolean: ['ansi'],
    default: {
      level: 'info',
      ansi: true
    }
  }
})

const print = new Print({ chalkEnabled: config.ansi })

function pinoPrint (line) {
  if (line[0] === '{') {
    let {
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
    } = parseJson(line) || {}

    const messages = []
    const isRequest = responseTime !== undefined

    // Determine type of log to use.
    let logType = 'debug'
    let logColor = 'magenta'
    if (level === 30) {
      logType = isRequest ? 'text' : 'info'
      logColor = isRequest ? 'white' : 'blue'
    } else if (level === 40) {
      logType = 'warn'
      logColor = 'yellow'
    } else if (level === 50) {
      logType = 'error'
      logColor = 'red'
    } else if (level === 60) {
      logType = 'fatal'
      logColor = 'red'
    }

    if (time) {
      const datetime = new Date(time)
      const [second, meridiem] = datetime.toLocaleTimeString().split(' ')
      const ms = `${datetime.getMilliseconds()}`.padEnd(3, '0')
      const date = datetime.toLocaleDateString()
      messages.push(
        chalk.white.bold(`${date} ${second}.${ms}${meridiem.toLowerCase()} ●`)
      )
    }

    if (res && res.statusCode) {
      messages.push(chalk[logColor](res.statusCode))
    }

    if (req && req.method && isRequest) {
      messages.push(chalk[logColor](req.method))
    }

    if (req && req.url && isRequest) {
      messages.push(chalk[logColor](req.url))
    }

    if (msg) {
      messages.push(chalk[logColor](msg))
    }

    if (isRequest) {
      responseTime = responseTime === 0 ? '< 1' : responseTime
      // FIXME: use timer to get a better formatted duration string.
      messages.push(chalk.dim(`in ${responseTime}ms`))
    }

    // Add back information if log level is debug.
    if (config.level === 'debug' && isRequest) {
      rest.hostname = hostname
      rest.pid = pid
      rest.req = {
        id: req.id,
        headers: req.headers
      }
      rest.res = { headers: res.headers }
    }

    print[logType](...messages, ...Object.keys(rest).length ? [rest] : [])
  } else {
    if (config.ansi) {
      print.write(line)
    } else {
      print.write(stripAnsi(line))
    }
  }
}

process.stdin.pipe(split(pinoPrint))
