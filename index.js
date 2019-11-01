#!/usr/bin/env node

const { Print, chalk } = require('@ianwalter/print')
const split = require('split2')
const parseJson = require('fast-json-parse')
const cli = require('@ianwalter/cli')
const stripAnsi = require('strip-ansi')

const config = cli({
  name: 'pino-print',
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

function pinoPrint (line) {
  if (line[0] === '{') {
    const { err, value } = parseJson(line)

    // If the line couldn't be parsed as JSON, log the line without formatting
    // it as a request/response.
    if (err) {
      return passthrough(line)
    }

    let {
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
    } = value

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

    const hasUrl = isRequest && req && req.url
    if (hasUrl) {
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

    if (hasUrl && config.static && req.url.includes(config.static)) {
      // Reset rest object so it doesn't get logged if the request is for a
      // static URL and the static option is set.
      rest = {}
    } else if (isRequest && config.level === 'debug') {
      // Add back information if log level is debug.
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
    passthrough(line)
  }
}

process.stdin.pipe(split(pinoPrint))
