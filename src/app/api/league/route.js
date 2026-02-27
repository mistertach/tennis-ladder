import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// Helper to shuffle array
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper to generate Round Robin matches for 4 players
const generateMatches = (memberIds) => {
    // Players: 0, 1, 2, 3
    // Round 1: 0v1, 2v3
    // Round 2: 0v2, 1v3
    // Round 3: 0v3, 1v2
    const m = memberIds
    return [
        { p1: m[0], p2: m[1], round: 1 }, { p1: m[2], p2: m[3], round: 1 },
        { p1: m[0], p2: m[2], round: 2 }, { p1: m[1], p2: m[3], round: 2 },
        { p1: m[0], p2: m[3], round: 3 }, { p1: m[1], p2: m[2], round: 3 }
    ]
}

export async function POST(req) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { title, startDate, durationWeeks, gamesPerMatch, players } = body

    if (!players || players.length === 0 || players.length % 4 !== 0) {
        return new NextResponse('Invalid player count. Must be multiple of 4.', { status: 400 })
    }

    try {
        // 1. Process Players (Upsert)
        const processedPlayers = []

        // We need to do this sequentially or carefully to get IDs back
        for (const p of players) {
            // p is now an object: { id?: string, name: string, email?: string, level: string }
            const name = p.name.trim()
            let email = p.email ? p.email.trim() : null
            const level = p.level || 'BEGINNER'

            // Generate email if missing: name.timestamp@league.com to ensure uniqueness
            if (!email) {
                const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '')
                email = `${sanitized}.${Date.now()}@league.local`
            }

            // Upsert User
            const user = await prisma.user.upsert({
                where: { email },
                update: {
                    name,
                    level
                },
                create: {
                    email,
                    name,
                    role: 'PLAYER',
                    level,
                    password: null
                }
            })
            processedPlayers.push(user)
        }

        // 2. Shuffle Players
        const shuffled = shuffle([...processedPlayers])

        // 3. Create League, Groups, Members, Matches in a transaction
        await prisma.$transaction(async (tx) => {
            const league = await tx.league.create({
                data: {
                    title,
                    startDate: new Date(startDate),
                    durationWeeks,
                    gamesPerMatch,
                    status: 'ACTIVE'
                }
            })

            // Chunk into groups of 4
            const groupCount = shuffled.length / 4

            for (let i = 0; i < groupCount; i++) {
                const groupPlayers = shuffled.slice(i * 4, (i + 1) * 4)

                // Create Group
                const group = await tx.group.create({
                    data: {
                        leagueId: league.id,
                        tier: i + 1, // Tier 1, 2, 3...
                    }
                })

                // Add Members to Group (Bulk)
                await tx.groupMember.createMany({
                    data: groupPlayers.map(p => ({
                        userId: p.id,
                        groupId: group.id,
                        points: 0
                    }))
                })

                // Generate Matches
                const memberIds = groupPlayers.map(p => p.id)
                const matchups = generateMatches(memberIds)

                // Create Matches (Bulk)
                await tx.match.createMany({
                    data: matchups.map(match => ({
                        groupId: group.id,
                        player1Id: match.p1,
                        player2Id: match.p2,
                        round: match.round,
                        status: 'SCHEDULED'
                    }))
                })

                // Initialize WeeklyScores for Rounds 1-3 (Bulk)
                const weeklyScoresData = []
                for (const p of groupPlayers) {
                    for (let r = 1; r <= 3; r++) {
                        weeklyScoresData.push({
                            groupId: group.id,
                            userId: p.id,
                            week: r,
                            gamesWon: null,
                            subNeeded: false
                        })
                    }
                }
                await tx.weeklyScore.createMany({
                    data: weeklyScoresData
                })
            }
        }, {
            maxWait: 5000, // Wait for lock
            timeout: 20000 // Transaction timeout (20s)
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return new NextResponse(error.message, { status: 500 })
    }
}
