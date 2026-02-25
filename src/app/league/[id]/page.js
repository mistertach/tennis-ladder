import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import styles from './page.module.css'
import WeekSelector from './components/WeekSelector'
import GroupCard from './components/GroupCard'
import AutoGenerateCheck from './components/AutoGenerateCheck'

export const dynamic = 'force-dynamic'

export default async function PublicLeaguePage({ params, searchParams }) {
    const { id } = await params
    const { week } = await searchParams

    const currentWeek = week ? parseInt(week) : 1

    const league = await prisma.league.findUnique({
        where: { id },
        include: {
            groups: {
                include: {
                    members: {
                        where: { week: currentWeek },
                        orderBy: { rank: 'asc' }, // Explicit seeding order
                        include: {
                            user: true
                        }
                    },
                    matches: {
                        where: { round: currentWeek },
                        include: {
                            player1: true,
                            player2: true
                        }
                    },
                    weeklyScores: {
                        where: { week: currentWeek },
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    tier: 'asc'
                }
            }
        }
    })

    if (league) {
        console.log(`[DEBUG] Page Load: League ${id}, Week ${currentWeek}`)
        league.groups.forEach(g => {
            console.log(`[DEBUG] Group ${g.tier} (${g.id}): ${g.members.length} Members, ${g.weeklyScores.length} Scores`)
            if (g.weeklyScores.length > 0) {
                console.log(`[DEBUG] Sample Score:`, g.weeklyScores[0])
            }
        })
    }

    if (!league) {
        notFound()
    }

    // Determine date for the week
    const startDate = new Date(league.startDate)
    // Add weeks
    const weekDate = new Date(startDate)
    weekDate.setDate(startDate.getDate() + (currentWeek - 1) * 7)

    const dateStr = weekDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    })

    // Check if this week has any members
    const hasMembers = league.groups.some(g => g.members.length > 0)

    if (!hasMembers) {

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{league.title}</h1>
                    <WeekSelector
                        currentWeek={currentWeek}
                        totalWeeks={league.durationWeeks}
                        baseUrl={`/league/${id}`}
                        dateStr={dateStr}
                    />
                </header>
                <main className={styles.grid}>
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>
                        <h3>No matches scheduled for Week {currentWeek} yet.</h3>
                        <AutoGenerateCheck leagueId={id} week={currentWeek} />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{league.title}</h1>
                <WeekSelector
                    currentWeek={currentWeek}
                    totalWeeks={league.durationWeeks}
                    baseUrl={`/league/${id}`}
                    dateStr={dateStr}
                />
            </header>

            <main className={styles.grid}>
                {(() => {
                    let cumulativeRank = 0
                    return league.groups.map(group => {
                        const startingRank = cumulativeRank
                        cumulativeRank += group.members.length
                        return (
                            <GroupCard
                                key={`${group.id}-${currentWeek}`}
                                group={group}
                                week={currentWeek}
                                scores={group.weeklyScores}
                                gamesPerMatch={league.gamesPerMatch}
                                totalTiers={league.groups.length}
                                startingRank={startingRank}
                            />
                        )
                    })
                })()}
            </main>
        </div>
    )
}
