const { join } = require('path')
const { Readable } = require('stream')
const { test } = require('@ianwalter/bff')
const execa = require('execa')

const pinoPrint = join(__dirname, '../')
const lineOne = JSON.stringify({
  time: 1544043395681,
  hostname: 'host',
  level: 50,
  msg: 'TestError: blah blah blah',
  pid: 1,
  req: { path: '/test' },
  res: { statusCode: 500 },
  responseTime: 116,
  v: 1
}) + '\n'
const lineTwo = JSON.stringify({
  time: 1544043391245,
  hostname: 'host',
  level: 30,
  msg: 'A user forgot their password',
  pid: 1,
  req: { path: '/api/password-reset' },
  res: { statusCode: 201 },
  responseTime: 288,
  v: 1
}) + '\n'
const withoutTs = line => {
  const [first, second] = line.split('●')
  return second || first
}

test('pino-print', ({ expect }) => {
  return new Promise(resolve => {
    const stdin = new Readable({ read () {} })
    const cp = execa('node', [pinoPrint])
    let counter = 0
    cp.stdout.on('data', data => {
      const lines = data.toString().split('\n').map(withoutTs).filter(l => l)
      expect(lines).toMatchSnapshot()
      if (counter) {
        resolve()
      } else {
        counter++
      }
    })
    stdin.pipe(cp.stdin)
    stdin.push(lineOne)
    stdin.push(lineTwo)
    stdin.push(null) // Push null to close the stream.
  })
})
