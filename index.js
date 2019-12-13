const { Print, chalk } = require('@ianwalter/print')
const stripAnsi = require('strip-ansi')

const defaults = {
  level: 'info',
  ansi: true
}

module.exports = function pinoPrint (config) {
  const options = Object.assign({}, defaults, config)

  // Create the Print instance based on the CLI or prettyPrint options.
  const print = new Print({
    stream: options.stream,
    ...options.ansi ? {} : { chalkLevel: 0 }
  })

  return function prettifier (line) {
    if (typeof line === 'string') {
      try {
        line = JSON.parse(line)
      } catch (err) {
        // If the line couldn't be parsed as JSON, return it without formatting.
        return print.write(line)
      }
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
    } = line

    const messages = []
    const isRequest = responseTime !== undefined

    // Determine type of log to use.
    let logType = 'debug'
    let logColor = 'magenta'
    if (level === 30) {
      logType = isRequest ? 'log' : 'info'
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

    if (hasUrl && options.static && req.url.includes(options.static)) {
      // Reset rest object so it doesn't get logged if the request is for a
      // static URL and the static option is set.
      rest = {}
    } else if (isRequest && options.level === 'debug') {
      // Add back information if log level is debug.
      rest.hostname = hostname
      rest.pid = pid
      rest.req = {
        id: req.id,
        headers: req.headers
      }
      rest.res = { headers: res.headers }
    }

    line = print[logType](
      ...logType === 'log' ? [null] : [],
      ...messages,
      ...Object.keys(rest).length ? [rest] : []
    )

    return options.ansi ? line : stripAnsi(line)
  }
}
