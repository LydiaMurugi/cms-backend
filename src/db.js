import pkg from 'pg'
import dotenv from 'dotenv/config'

// dotenv.config()
const { Pool } = pkg

 const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// test the connection
pool.connect()
  .then(client => {
    console.log('✅ DB connected successfully')
    client.release()
  })
  .catch(err => console.error('DB connection error ❌', err))

  export default pool 


