const COUNTRIES = ['🇦🇷', '🇦🇺', '🇦🇹', '🇧🇪', '🇧🇷', '🇨🇦', '🇨🇱', '🇨🇳', '🇨🇴', '🇭🇷', '🇨🇿', '🇩🇰', '🇪🇬', '🇫🇷', '🇩🇪', '🇬🇧', '🇬🇷', '🇮🇳', '🇮🇪', '🇮🇱', '🇮🇹', '🇯🇵', '🇰🇿', '🇱🇻', '🇲🇽', '🇳🇱', '🇳🇿', '🇳🇴', '🇵🇱', '🇵🇹', '🇷🇴', '🇷🇺', '🇷🇸', '🇸🇰', '🇿🇦', '🇰🇷', '🇪🇸', '🇸🇪', '🇨🇭', '🇹🇼', '🇹🇳', '🇺🇦', '🇺🇸']
const HANDEDNESS_OPTS = ['RIGHT', 'LEFT', 'AMBIDEXTROUS']

async function main() {
    console.log("Starting seed of metadata...")
    const prismaModule = await import('./src/lib/prisma.js')
    const prisma = prismaModule.default || prismaModule

    const users = await prisma.user.findMany()

    // Seed Nationalities and Handedness
    let natCount = 0
    let handCount = 0
    let genderCount = 0

    for (const u of users) {
        const updateData = {}
        if (!u.nationality) {
            updateData.nationality = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
            natCount++
        }
        if (!u.handedness) {
            updateData.handedness = HANDEDNESS_OPTS[Math.floor(Math.random() * HANDEDNESS_OPTS.length)]
            handCount++
        }
        if (!u.gender) {
            updateData.gender = Math.random() < 0.5 ? 'MALE' : 'FEMALE'
            genderCount++
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: u.id },
                data: updateData
            })
        }
    }

    console.log(`Updated ${natCount} users with a random nationality.`)
    console.log(`Updated ${handCount} users with a random handedness.`)
    console.log(`Updated ${genderCount} users with a random gender.`)

    // Seed Sub Needed History
    const allGroups = await prisma.group.findMany({ include: { members: true } })
    let subCount = 0
    for (const group of allGroups) {
        for (const member of group.members) {
            // 20% chance of needing a sub in week 1
            if (Math.random() < 0.20) {
                // Upsert a WeeklyScore record
                await prisma.weeklyScore.upsert({
                    where: {
                        groupId_userId_week: {
                            groupId: group.id,
                            userId: member.userId,
                            week: 1
                        }
                    },
                    create: {
                        groupId: group.id,
                        userId: member.userId,
                        week: 1,
                        subNeeded: true
                    },
                    update: {
                        subNeeded: true
                    }
                })
                subCount++
            }
        }
    }
    console.log(`Seeded ${subCount} 'subNeeded' records for users.`)
    console.log("Done seeding!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
