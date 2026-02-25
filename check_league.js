
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const leagues = await prisma.league.findMany()
    console.log(JSON.stringify(leagues, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
