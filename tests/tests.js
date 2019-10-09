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
const lineThree = "{ Error => `Lalala-la lalal-la Elmo's world!` }"
const withoutTs = line => {
  const [first, second] = line.split('●')
  return second || first
}
const emptyLines = line => line

test('pino-print', ({ expect }) => {
  return new Promise(resolve => {
    const stdin = new Readable({ read () {} })
    const cp = execa('node', [pinoPrint], { reject: false })

    let lines = []
    cp.stdout.on('data', data => {
      const rawLines = data.toString().split('\n')
      lines = lines.concat(rawLines.map(withoutTs).filter(emptyLines))
    })
    cp.stdout.on('close', () => {
      expect(lines).toMatchSnapshot()
      resolve()
    })

    // 
    stdin.pipe(cp.stdin)
    stdin.push(lineOne)
    stdin.push(lineTwo)
    stdin.push(lineThree)

    // Push null to close the streams.
    stdin.push(null)
    cp.stdin.push(null)
  })
})
