import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') // ?q=John

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    try {
        const players = await prisma.user.findMany({
            where: {
                AND: [
                    { role: 'PLAYER' },
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                level: true
            }
        })

        return NextResponse.json(players)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
