import prisma from "@/lib/prisma"

export async function checkWeekComplete(leagueId, week) {
    const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
            groups: {
                include: {
                    members: {
                        where: { week: week },
                        include: { user: true }
                    },
                    weeklyScores: {
                        where: { week: week }
                    }
                }
            }
        }
    })

    if (!league) return false

    // Check every group
    for (const group of league.groups) {
        // If group has no members, it's "complete" (or rather, irrelevant)
        if (group.members.length === 0) continue

        // Check if every member has a score or no-show
        const allMembersComplete = group.members.every(member => {
            const score = group.weeklyScores.find(s => s.userId === member.userId)
            // Score is complete if:
            // 1. It exists AND (gamesWon is not null OR noShow is true)
            // 0 is valid! null is not.
            return score && (score.gamesWon !== null || score.noShow)
        })

        if (!allMembersComplete) return false
    }

    return true
}
