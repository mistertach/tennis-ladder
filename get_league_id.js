const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const leagues = await prisma.league.findMany({ orderBy: { createdAt: 'desc' } })
    console.log('Current Leagues:')
    leagues.forEach(l => console.log(`${l.title}: ${l.id}`))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
