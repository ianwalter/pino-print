const pino = require('koa-pino-logger')
const { createKoaServer } = require('@ianwalter/test-server')
const { Requester } = require('@ianwalter/requester')
const { print } = require('@ianwalter/print')
const requester = new Requester({ shouldThrow: false })

async function run () {
  print.info('Starting server')
  const server = await createKoaServer()
  server.use(pino({ level: 'debug' }))
  server.use(ctx => {
    if (ctx.req.method === 'POST') {
      ctx.body = { version: '1.0.0' }
      ctx.log.debug(ctx.body, 'Entered root POST handler')
    } else {
      ctx.status = 204
    }
  })
  await requester.get(server.url)
  await requester.get(`${server.url}/static/a.gif`)
  await requester.post(server.url, { body: { message: 'in a bottle' } })
  console.log('\nconsole.log should still work, btw\n')
  await server.close()
}

run()
