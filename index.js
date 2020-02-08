const { Print, chalk } = require('@ianwalter/print')
const stripAnsi = require('strip-ansi')

// Defaults for when the prettifier function is being used via require and not
// through the CLI.
const defaults = {
  verbose: false,
  ansi: true
}

module.exports = function pinoPrint (config) {
  const options = Object.assign({}, defaults, config)

  // Create the Print instance based on the CLI or prettyPrint options.
  const print = new Print({
    stream: false,
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
      err,
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

    // Format the Unix timestamp into a readable date.
    if (time) {
      const datetime = new Date(time)
      const [second, meridiem] = datetime.toLocaleTimeString().split(' ')
      const ms = `${datetime.getMilliseconds()}`.padEnd(3, '0')
      const date = datetime.toLocaleDateString()
      messages.push(
        chalk.white.bold(`${date} ${second}.${ms}${meridiem.toLowerCase()} ◦`)
      )
    }

    // Output the request ID if set.
    if (req && req.id) {
      messages.push(`${req.id} ◦`)
    }

    // Output the response HTTP status code if set.
    if (res && res.statusCode) {
      messages.push(chalk[logColor](res.statusCode))
    }

    // Output the HTTP request method if set.
    if (req && req.method && isRequest) {
      messages.push(chalk[logColor](req.method))
    }

    // Output the request URL path if set.
    const hasUrl = isRequest && req && req.url
    if (hasUrl) {
      messages.push(chalk[logColor](req.url))
    }

    // Output the log message if set.
    if (msg) {
      messages.push(chalk[logColor](msg))
    }

    // Output the amount of time it took for the request to receive a response.
    if (isRequest) {
      responseTime = responseTime === 0 ? '< 1' : responseTime
      // FIXME: use timer to get a better formatted duration string.
      messages.push(chalk.dim(`in ${responseTime}ms`))
    }

    if (hasUrl && options.static && req.url.includes(options.static)) {
      // Reset rest object so it doesn't get logged if the request is for a
      // static URL and the static option is set.
      rest = {}
    } else if (isRequest && options.verbose) {
      // Add back information if log level is debug.
      const { method, url, ...restOfReq } = req
      rest.req = restOfReq
      const { statusCode, ...restOfRes } = res
      rest.res = restOfRes
    }

    // Replace the line with the line formatted by print.
    line = print[logType](
      ...logType === 'log' ? [null] : [],
      ...messages,
      ...Object.keys(rest).length ? [rest] : []
    )

    // Return the line string to the stream.
    return options.ansi ? line : stripAnsi(line)
  }
}
