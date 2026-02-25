import Link from "next/link"
import styles from "./page.module.css" // reuse or new? reuse dashboard styles or create new
import ManageLeagueClient from "./ManageLeagueClient"

export const dynamic = 'force-dynamic'

export default async function ManageLeaguePage({ params }) {
    const { id } = await params

    const league = await prisma.league.findUnique({
        where: { id },
        include: {
            groups: {
                include: {
                    members: {
                        include: { user: true }
                    }
                },
                orderBy: { tier: 'asc' }
            }
        }
    })

    if (!league) notFound()

    // Filter group members to only show the roster for the current week
    league.groups = league.groups.map(group => ({
        ...group,
        members: group.members.filter(m => m.week === league.currentWeek)
    }))

    // Fetch all users for swap dropdown
    const allUsers = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none' }}>← Back to Dashboard</Link>
            </div>

            <h1>Manage League: {league.title}</h1>
            <p>Current Week: <strong>{league.currentWeek}</strong></p>
            <p>Status: {league.status}</p>

            <ManageLeagueClient league={league} allUsers={allUsers} />
        </div>
    )
}
