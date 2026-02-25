import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { scorePlayer1, scorePlayer2 } = await request.json()

    // Validate input
    if (typeof scorePlayer1 !== 'number' || typeof scorePlayer2 !== 'number') {
        return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
    }

    try {
        const match = await prisma.match.findUnique({
            where: { id },
            include: {
                group: {
                    include: {
                        members: true
                    }
                }
            }
        })

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 })
        }

        // Verify user is part of the match
        if (match.player1Id !== session.user.id && match.player2Id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Check if match is already completed? 
        // Maybe allow updates, but for now let's assume valid.

        // Determine points
        // Simple rule: Winner gets 3 points, Loser gets 1 point.
        // If draw (unlikely in tennis sets, but possible if time limit), 2 points each?
        // Let's assume strict win/loss for now based on sets.

        let p1PointsToAdd = 0
        let p2PointsToAdd = 0
        let winnerId = null

        if (scorePlayer1 > scorePlayer2) {
            p1PointsToAdd = 3
            p2PointsToAdd = 1
            winnerId = match.player1Id
        } else if (scorePlayer2 > scorePlayer1) {
            p1PointsToAdd = 1
            p2PointsToAdd = 3
            winnerId = match.player2Id
        } else {
            // Draw?
            p1PointsToAdd = 2
            p2PointsToAdd = 2
        }

        // Update Match
        await prisma.match.update({
            where: { id },
            data: {
                scorePlayer1,
                scorePlayer2,
                status: 'COMPLETED',
                winnerId
            }
        })

        // Update Points for Group Members
        // This assumes points are cumulative. 
        // If we re-report, we might double count.
        // Ideally we should recalculate points from scratch or check if previously completed.

        if (match.status !== 'COMPLETED') {
            // Only add points if match wasn't already completed
            await prisma.groupMember.updateMany({
                where: {
                    groupId: match.groupId,
                    userId: match.player1Id
                },
                data: {
                    points: { increment: p1PointsToAdd },
                    matchesPlayed: { increment: 1 },
                    matchesWon: scorePlayer1 > scorePlayer2 ? { increment: 1 } : undefined,
                    matchesLost: scorePlayer1 < scorePlayer2 ? { increment: 1 } : undefined,
                }
            })

            await prisma.groupMember.updateMany({
                where: {
                    groupId: match.groupId,
                    userId: match.player2Id
                },
                data: {
                    points: { increment: p2PointsToAdd },
                    matchesPlayed: { increment: 1 },
                    matchesWon: scorePlayer2 > scorePlayer1 ? { increment: 1 } : undefined,
                    matchesLost: scorePlayer2 < scorePlayer1 ? { increment: 1 } : undefined,
                }
            })
        } else {
            // If updating a completed match, we'd need complex logic to revert previous points.
            // For MVP, let's just update the score display but NOT points to avoid corruption.
            // Or return a warning.
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error reporting score:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
