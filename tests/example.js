const pino = require('koa-pino-logger')
const { createKoaServer } = require('@ianwalter/test-server')
const { Requester } = require('@ianwalter/requester')

const requester = new Requester({ shouldThrow: false })

async function run () {
  const server = await createKoaServer()
  server.use(pino({ level: 'debug' }))
  server.use(ctx => {
    if (ctx.req.method === 'POST') {
      ctx.body = { version: '1.0.0' }
    } else {
      ctx.log.debug('Entered root GET handler')
      ctx.status = 204
    }
  })
  await requester.get(server.url)
  await requester.post(server.url, { body: { message: 'in a bottle' } })
  await server.close()
}

run()
