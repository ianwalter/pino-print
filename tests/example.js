const pino = require('koa-pino-logger')
const { createKoaServer } = require('@ianwalter/test-server')
const { Requester } = require('@ianwalter/requester')

const requester = new Requester({ shouldThrow: false })

async function run () {
  const server = await createKoaServer()
  server.use(pino())
  await requester.get(server.url)
  await server.close()
}

run()
