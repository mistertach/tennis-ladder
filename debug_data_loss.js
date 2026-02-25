// Debug script to check data persistence
require('dotenv').config({ path: '.env' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    // 1. Find the league
    const league = await prisma.league.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { groups: { include: { members: true } } }
    })

    if (!league) {
        console.log("No league found")
        return
    }

    console.log(`Checking League: ${league.title} (${league.id})`)
    console.log(`Current Week: ${league.currentWeek}`)

    // 2. Check Week 1 Members
    const w1Members = await prisma.groupMember.count({
        where: {
            group: { leagueId: league.id },
            week: 1
        }
    })
    console.log(`Week 1 Members Count: ${w1Members}`)

    // 3. Check Week 2 Members
    const w2Members = await prisma.groupMember.count({
        where: {
            group: { leagueId: league.id },
            week: 2
        }
    })
    console.log(`Week 2 Members Count: ${w2Members}`)

    if (w1Members === 0) {
        console.error("CRITICAL: Week 1 members are GONE!")
    } else {
        console.log("Week 1 data persists.")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
