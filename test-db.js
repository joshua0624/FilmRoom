const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.team.count()
  console.log('Teams count:', count)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())