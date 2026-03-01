'use server'

import prisma from '@/lib/prisma'

export async function getSessionsForWeek(startDateIso, endDateIso) {
    const sessions = await prisma.coachingSession.findMany({
        where: {
            date: {
                gte: new Date(startDateIso),
                lte: new Date(endDateIso)
            }
        },
        include: {
            coach: true,
            students: {
                include: { user: { select: { id: true, name: true } } }
            }
        },
        orderBy: { date: 'asc' }
    })
    return sessions
}
