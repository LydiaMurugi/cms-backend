import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'superadmin@niafricachms.com'
  const plainPassword = '1amGr00t'

  const existing = await prisma.users.findUnique({ where: { email } })
  if (existing) {
    console.log(`Super admin already exists: ${email}`)
    return
  }

  const password_hash = await bcrypt.hash(plainPassword, 12)

  const user = await prisma.users.create({
    data: {
      name: 'Super Admin',
      email,
      password_hash,
      role: 'super-admin',
      status: 'Active',
      permissions: [],
      tenant_id: null,
    },
  })

  console.log(`Super admin created — id: ${user.id}, email: ${user.email}`)
  console.log(`Temporary password: ${plainPassword}`)
  console.log('Change this password immediately after first login.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
