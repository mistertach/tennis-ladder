
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const leagueData = {
    title: "Feb 2026 League",
    startDate: new Date(),
    durationWeeks: 4,
    groups: [
        {
            tier: 1,
            time: "5pm",
            court: "2 & 3",
            day: "Saturday",
            players: ["Jose Santos", "Barrry Lawrence", "Seungjun Oh", "Steven he"]
        },
        {
            tier: 2,
            time: "5pm",
            court: "4 & 5",
            day: "Saturday",
            players: ["PRADEEP SRIDHARAN", "Kennedy Botty", "Mohammed Medallah", "Syed Haider"]
        },
        {
            tier: 3,
            time: "5pm",
            court: "7 & 8",
            day: "Saturday",
            players: ["Abul Fahimuddin", "Victor Dolgov", "Osama Tuwayrib", "Steve Paglieri"]
        },
        {
            tier: 4,
            time: "7pm",
            court: "2 & 3",
            day: "Saturday",
            players: ["Daniel Bejarano", "Helder Martins", "Alastair Earles", "Thuy Blakey"]
        },
        {
            tier: 5,
            time: "7pm",
            court: "4 & 5",
            day: "Saturday",
            players: ["Sandi Paglieri", "Naveen Shakir", "Mohammed Rashed", "Mikhail Konfektov"]
        },
        {
            tier: 6,
            time: "7pm",
            court: "7 & 8",
            day: "Saturday",
            players: ["Abhishek chourasia", "Seham Boulaiyan", "Vikas Sahu", "Mohammed Sharedah"]
        }
    ]
}

async function main() {
    console.log(`Start seeding league: ${leagueData.title}...`)

    // 1. Create League
    const league = await prisma.league.create({
        data: {
            title: leagueData.title,
            startDate: leagueData.startDate,
            durationWeeks: leagueData.durationWeeks,
            status: 'ACTIVE',
            gamesPerMatch: 7
        }
    })

    console.log(`Created league with id: ${league.id}`)

    // 2. Create Groups and Players
    for (const groupData of leagueData.groups) {
        const group = await prisma.group.create({
            data: {
                leagueId: league.id,
                tier: groupData.tier,
                time: groupData.time,
                court: groupData.court,
                day: groupData.day
            }
        })
        console.log(`Created Group ${group.tier}`)

        // 3. Add members
        const groupMembers = groupData.players // Assuming 'players' is the intended list of members
        for (let index = 0; index < groupMembers.length; index++) {
            const memberName = groupMembers[index]

            // Mock email
            const email = `${memberName.toLowerCase().replace(/\s+/g, '.')}@example.com`

            const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email,
                    name: memberName,
                    password: 'password123', // Default pw
                }
            })

            await prisma.groupMember.create({
                data: {
                    groupId: group.id,
                    userId: user.id,
                    week: 1, // Initialize with week 1
                    rank: index + 1 // Explicit rank based on seed list order
                }
            })
        }
    }

    console.log(`Seeding finished.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
