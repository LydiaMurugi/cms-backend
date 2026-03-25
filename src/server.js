import express from 'express'
import cors from 'cors'
import  './db.js'
import membersRoutes from './routes/membersRoutes.js'
import authRoutes from './routes/authRoutes.js' 
import dashboardRoutes from './routes/dashboardRoutes.js'
import financeRoutes from './routes/financeRoutes.js' 
import projectRoutes from './routes/projectRoutes.js' 
import dutiesRoutes from './routes/dutiesRoutes.js'   
import programsRoutes from './routes/programsRoutes.js' 
import resourceRoutes from './routes/resourceRoutes.js' 
import notificationRoutes from './routes/notificationRoutes.js'   
import tenantRoutes from './routes/tenantRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Church API running')
})
app.use('/api/tenants', tenantRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', membersRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/finance", financeRoutes)  
app.use("/api/projects", projectRoutes)
app.use("/api/duties", dutiesRoutes);
app.use("/api/programs", programsRoutes);
app.use("/api/resources", resourceRoutes)
app.use("/uploads", express.static("uploads"))
app.use("/api/notifications", notificationRoutes) 
app.use("/api/settings", settingsRoutes)

const PORT = 4000

console.log('Starting server...')

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})










