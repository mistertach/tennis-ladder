import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma" // Import prisma
import AdminView from "./components/AdminView"
import PlayerView from "./components/PlayerView"
import styles from "./page.module.css"

export const metadata = {
    title: "Dashboard | Tennis League",
}

export default async function Dashboard() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/api/auth/signin')
    }

    // Fetch data for Admin View here
    let adminProps = {}
    if (session.user.role === 'ADMIN') {
        const [
            leagues,
            totalPlayers,
            totalBoardMembers,
            totalActiveLeagues,
            usersWithMatches,
            subsGrouped,
            nationalityGrouped,
            handednessGrouped,
            genderGrouped
        ] = await Promise.all([
            prisma.league.findMany({ orderBy: { createdAt: 'desc' } }),
            prisma.user.count({ where: { role: 'PLAYER' } }),
            prisma.user.count({ where: { isDtaBoardMember: true } }),
            prisma.league.count({ where: { status: { in: ['DRAFT', 'ACTIVE'] } } }),
            prisma.user.findMany({
                where: { role: 'PLAYER' },
                include: {
                    _count: {
                        select: { groups: true }
                    }
                }
            }),
            prisma.weeklyScore.groupBy({
                by: ['userId'],
                _count: { subNeeded: true },
                where: { subNeeded: true },
                orderBy: { _count: { subNeeded: 'desc' } },
                take: 5
            }),
            prisma.user.groupBy({
                by: ['nationality'],
                _count: { _all: true },
                where: { role: 'PLAYER', nationality: { not: null } },
                orderBy: {
                    _count: {
                        nationality: 'desc'
                    }
                },
                take: 10
            }),
            prisma.user.groupBy({
                by: ['handedness'],
                _count: { _all: true },
                where: { role: 'PLAYER', handedness: { not: null } },
                orderBy: {
                    _count: {
                        handedness: 'desc'
                    }
                }
            }),
            prisma.user.groupBy({
                by: ['gender'],
                _count: { _all: true },
                where: { role: 'PLAYER', gender: { not: null } },
                orderBy: {
                    _count: {
                        gender: 'desc'
                    }
                }
            })
        ])

        // Process top active players in JS
        const playersByActivity = usersWithMatches.map(u => ({
            id: u.id,
            name: u.name,
            appearances: u._count.groups
        })).sort((a, b) => b.appearances - a.appearances).slice(0, 5)

        // Process top subs to get names (groupBy doesn't include related fields)
        const topSubsIds = subsGrouped.map(s => s.userId)
        const subUsers = await prisma.user.findMany({ where: { id: { in: topSubsIds } }, select: { id: true, name: true } })
        const topSubs = subsGrouped.map(s => ({
            name: subUsers.find(u => u.id === s.userId)?.name || 'Unknown',
            count: s._count.subNeeded
        }))

        const stats = {
            totalPlayers,
            totalBoardMembers,
            totalActiveLeagues
        }

        const analytics = {
            topActive: playersByActivity,
            topSubs,
            nationalities: nationalityGrouped,
            handedness: handednessGrouped,
            genders: genderGrouped
        }

        adminProps = { leagues, stats, analytics }
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Welcome, {session.user.name}</h1>

            {session.user.role === 'ADMIN' ? (
                <AdminView user={session.user} {...adminProps} />
            ) : (
                <PlayerView user={session.user} />
            )}
        </div>
    )
}
