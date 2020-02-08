const { createApp } = require('@ianwalter/nrg')
const { Requester } = require('@ianwalter/requester')
const pinoPrint = require('..')

const requester = new Requester({ shouldThrow: false })

async function run () {
  const app = await createApp({ log: { prettifier: pinoPrint } }).start()
  app.use(ctx => {
    if (ctx.req.method === 'POST') {
      ctx.body = { version: '1.0.0' }
      ctx.log.debug(ctx.body, 'Entered root POST handler')
    } else {
      ctx.status = 204
    }
  })
  await requester.get(app.server.url)
  await requester.get(`${app.server.url}/static/a.gif`)
  await requester.post(app.server.url, { body: { message: 'in a bottle' } })
  console.log('\nconsole.log should still work, btw\n')
  await app.server.close()
}

run()
