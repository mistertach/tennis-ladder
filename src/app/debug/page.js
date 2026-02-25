import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
    const memberCounts = await prisma.groupMember.groupBy({
        by: ['week', 'groupId'],
        _count: { userId: true },
        orderBy: { week: 'asc' }
    })

    const scoreCounts = await prisma.weeklyScore.groupBy({
        by: ['week', 'groupId'],
        _count: { id: true },
        orderBy: { week: 'asc' }
    })

    const matchCounts = await prisma.match.groupBy({
        by: ['round', 'groupId'],
        _count: { id: true },
        orderBy: { round: 'asc' }
    })

    return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
            <h1>Debug Data</h1>

            <h2>Group Members (Players per group/week)</h2>
            <pre>{JSON.stringify(memberCounts, null, 2)}</pre>

            <h2>Weekly Scores (Reported scores per group/week)</h2>
            <pre>{JSON.stringify(scoreCounts, null, 2)}</pre>

            <h2>Matches (Scheduled/Played matches per group/week)</h2>
            <pre>{JSON.stringify(matchCounts, null, 2)}</pre>

            <h2>League Status</h2>
            <pre>{JSON.stringify(await prisma.league.findFirst(), null, 2)}</pre>
        </div>
    )
}
