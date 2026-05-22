import 'dotenv/config'
import buildApp from './app'
import { pool } from './db/pool'

const start = async () => {
  const app = buildApp()
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})
process.on('SIGINT', async () => {
  await pool.end()
  process.exit(0)
})
