import prisma from '@/lib/prisma'
import styles from '../page.module.css'

export default async function PlayerView({ user }) {
    // Fetch groups member is part of
    const memberships = await prisma.groupMember.findMany({
        where: { userId: user.id },
        include: {
            group: {
                include: {
                    league: true,
                    matches: {
                        where: {
                            OR: [
                                { player1Id: user.id },
                                { player2Id: user.id }
                            ]
                        },
                        include: {
                            player1: true,
                            player2: true
                        }
                    }
                }
            }
        }
    })

    // Group by league or just list them?
    // Let's list active groups.

    return (
        <div>
            <h2 className={styles.title}>My Active Leagues</h2>

            {memberships.length === 0 ? (
                <div className={styles.section}>
                    <div className={styles.emptyState}>You are not part of any active league groups.</div>
                </div>
            ) : (
                memberships.map(membership => {
                    const group = membership.group
                    const matches = group.matches || []

                    return (
                        <div key={group.id} className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3 style={{ marginTop: 0 }}>{group.league.title} - Group Tier {group.tier}</h3>
                                <div>Points: {membership.points}</div>
                            </div>

                            <h4>Your Matches</h4>
                            {matches.length === 0 ? (
                                <div>No matches scheduled.</div>
                            ) : (
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Opponent</th>
                                                <th>Status</th>
                                                <th>Score</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matches.map(match => {
                                                const isP1 = match.player1Id === user.id
                                                const opponent = isP1 ? match.player2 : match.player1
                                                const myScore = isP1 ? match.scorePlayer1 : match.scorePlayer2
                                                const oppScore = isP1 ? match.scorePlayer2 : match.scorePlayer1

                                                return (
                                                    <tr key={match.id}>
                                                        <td>{opponent.name}</td>
                                                        <td>{match.status}</td>
                                                        <td>
                                                            {match.status === 'COMPLETED'
                                                                ? `${myScore} - ${oppScore}`
                                                                : '-'}
                                                        </td>
                                                        <td>
                                                            {match.status !== 'COMPLETED' && (
                                                                <Link
                                                                    href={`/dashboard/match/${match.id}/report`}
                                                                    className={styles.actionButton}
                                                                >
                                                                    Report Score
                                                                </Link>
                                                                // We'll link to report page later
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
                })
            )}
        </div>
    )
}
