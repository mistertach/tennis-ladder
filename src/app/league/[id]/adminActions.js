'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculateGroupStandings } from "@/lib/ranking"
import { checkWeekComplete } from "@/lib/progression"

export async function generateNextWeek(leagueId, options = {}) {
    const { forceRegenerate = false, isRainDelay = false } = options
    try {
        const league = await prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                groups: {
                    include: {
                        members: { include: { user: true } },
                        weeklyScores: true,
                        matches: true
                    },
                    orderBy: { tier: 'asc' }
                }
            }
        })

        if (!league) throw new Error("League not found")

        // If regenerating, we might be targetting a specific week, but for now let's assume valid "currentWeek" context.
        // Actually, if we are regenerating Week X, we successfully generated it before, so league.currentWeek might be X or X+1? 
        // Let's assume this action generates "The roster for league.currentWeek + 1" based on "league.currentWeek".
        // Wait, if we regenerate Week 2, we are essentially re-running the transition from Week 1 to Week 2.

        // Let's stick to the existing pattern: Generates roster for (currentWeek + 1) based on (currentWeek).
        // If forceRegenerate is true, we verify if (currentWeek + 1) already has data and wipe it.

        const currentWeek = league.currentWeek
        const nextWeek = currentWeek + 1
        const totalTiers = league.groups.length

        // Check if next week already exists
        const nextWeekExists = league.groups.some(g => g.members.some(m => m.week === nextWeek))

        if (nextWeekExists && !forceRegenerate) {
            return { success: false, message: "Next week already generated." }
        }

        // 1. Calculate Movements
        const buckets = Array.from({ length: totalTiers }, () => [])

        if (isRainDelay) {
            // Rain Delay: Copy current roster exactly
            for (const group of league.groups) {
                const tierIndex = group.tier - 1
                group.members.forEach(m => {
                    if (m.week === currentWeek) {
                        buckets[tierIndex].push({
                            userId: m.userId,
                            originTierIndex: tierIndex,
                            originRank: m.rank || 0 // Use existing rank if available
                        })
                    }
                })
            }
        } else {
            // Normal Progression
            for (const group of league.groups) {
                const tierIndex = group.tier - 1 // 0-based
                // Filter for current week's scores/members
                const currentMembers = group.members.filter(m => m.week === currentWeek)
                const scores = group.weeklyScores.filter(s => s.week === currentWeek)
                const matches = group.matches.filter(m => m.round === currentWeek)

                // Re-use the shared ranking logic
                const ranked = calculateGroupStandings(currentMembers, scores, matches, group.tier, totalTiers)

                for (const player of ranked) {
                    let targetTierIndex = tierIndex

                    if (player.status === 'UP') {
                        targetTierIndex = Math.max(0, tierIndex - 1)
                    } else if (player.status === 'DOWN') {
                        targetTierIndex = Math.min(totalTiers - 1, tierIndex + 1)
                    }

                    buckets[targetTierIndex].push({
                        userId: player.userId,
                        originTierIndex: tierIndex,
                        originRank: player.originalRank
                    })
                }
            }
        }

        // 2. Perform Updates
        await prisma.$transaction(async (tx) => {

            // If regenerating next week (force), clear next week's members first
            if (nextWeekExists && forceRegenerate) {
                const groupIds = league.groups.map(g => g.id)
                await tx.groupMember.deleteMany({
                    where: {
                        groupId: { in: groupIds },
                        week: nextWeek
                    }
                })
                await tx.weeklyScore.deleteMany({
                    where: {
                        groupId: { in: groupIds },
                        week: nextWeek
                    }
                })
            }

            // Create new members with Explicit Seeding
            for (let i = 0; i < totalTiers; i++) {
                const group = league.groups[i]

                const bucket = buckets[i].sort((a, b) => {
                    if (a.originTierIndex !== b.originTierIndex) {
                        return a.originTierIndex - b.originTierIndex
                    }
                    return a.originRank - b.originRank
                })

                if (bucket.length > 0) {
                    await tx.groupMember.createMany({
                        data: bucket.map((item, index) => ({
                            groupId: group.id,
                            userId: item.userId,
                            week: nextWeek,
                            rank: index + 1
                        }))
                    })

                    // Seed WeeklyScore for Next Week
                    const weeklyScoresData = bucket.map(item => ({
                        groupId: group.id,
                        userId: item.userId,
                        week: nextWeek,
                        gamesWon: null,
                        subNeeded: false
                    }))

                    // Only create scores if they don't explicitly exist (handled by deleteMany above if forceRegenerate)
                    // If normal generate, we just create them.
                    await tx.weeklyScore.createMany({
                        data: weeklyScoresData,
                        skipDuplicates: true
                    })
                }
            }

            // Increment League Week ONLY if not just regenerating next week
            if (!nextWeekExists) {
                await tx.league.update({
                    where: { id: leagueId },
                    data: { currentWeek: { increment: 1 } }
                })
            }
        })

        revalidatePath(`/league/${leagueId}`)
        return { success: true }
    } catch (e) {
        console.error("Failed to generate next week:", e)
        throw e
    }
}

export async function regenerateCurrentWeek(leagueId) {
    try {
        const league = await prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                groups: {
                    include: {
                        members: true,
                        weeklyScores: true,
                        matches: true
                    },
                    orderBy: { tier: 'asc' }
                }
            }
        })

        if (!league) throw new Error("League not found")

        const currentWeek = league.currentWeek
        if (currentWeek <= 1) {
            return { success: false, message: "Cannot regenerate Week 1 based on previous week (Week 0 does not exist)." }
        }

        const prevWeek = currentWeek - 1
        const totalTiers = league.groups.length

        // 1. Calculate Movements based on PREVIOUS week
        const buckets = Array.from({ length: totalTiers }, () => [])

        for (const group of league.groups) {
            const tierIndex = group.tier - 1
            const prevMembers = group.members.filter(m => m.week === prevWeek)
            const scores = group.weeklyScores.filter(s => s.week === prevWeek)
            const matches = group.matches.filter(m => m.round === prevWeek)

            const ranked = calculateGroupStandings(prevMembers, scores, matches, group.tier, totalTiers)

            for (const player of ranked) {
                let targetTierIndex = tierIndex

                if (player.status === 'UP') {
                    targetTierIndex = Math.max(0, tierIndex - 1)
                } else if (player.status === 'DOWN') {
                    targetTierIndex = Math.min(totalTiers - 1, tierIndex + 1)
                }

                buckets[targetTierIndex].push({
                    userId: player.userId,
                    originTierIndex: tierIndex,
                    originRank: player.originalRank
                })
            }
        }

        // 2. Perform Updates
        await prisma.$transaction(async (tx) => {
            const groupIds = league.groups.map(g => g.id)

            // Clear Current Week's Members and Scores
            await tx.groupMember.deleteMany({
                where: { groupId: { in: groupIds }, week: currentWeek }
            })
            await tx.weeklyScore.deleteMany({
                where: { groupId: { in: groupIds }, week: currentWeek }
            })

            // Recreate Current Week's Members and Scores
            for (let i = 0; i < totalTiers; i++) {
                const group = league.groups[i]

                const bucket = buckets[i].sort((a, b) => {
                    if (a.originTierIndex !== b.originTierIndex) {
                        return a.originTierIndex - b.originTierIndex
                    }
                    return a.originRank - b.originRank
                })

                if (bucket.length > 0) {
                    await tx.groupMember.createMany({
                        data: bucket.map((item, index) => ({
                            groupId: group.id,
                            userId: item.userId,
                            week: currentWeek,
                            rank: index + 1
                        }))
                    })

                    // Seed WeeklyScore for Current Week
                    const weeklyScoresData = bucket.map(item => ({
                        groupId: group.id,
                        userId: item.userId,
                        week: currentWeek,
                        gamesWon: null,
                        subNeeded: false
                    }))

                    await tx.weeklyScore.createMany({
                        data: weeklyScoresData,
                        skipDuplicates: true
                    })
                }
            }
        })

        revalidatePath(`/league/${leagueId}`)
        return { success: true }
    } catch (e) {
        console.error("Failed to regenerate current week:", e)
        throw e
    }
}

export async function triggerAutoGeneration(leagueId, targetWeek) {
    // Check if previous week is complete
    const prevWeek = targetWeek - 1
    if (prevWeek < 1) return { success: false }

    const isComplete = await checkWeekComplete(leagueId, prevWeek)
    if (isComplete) {
        // Double check we haven't already generated it (race condition safety)
        const league = await prisma.league.findUnique({
            where: { id: leagueId },
            include: { groups: { include: { members: { where: { week: targetWeek } } } } }
        })
        const exists = league.groups.some(g => g.members.length > 0)

        if (!exists) {
            await generateNextWeek(leagueId)
            return { success: true }
        }
    }
    return { success: false }
}

export async function swapGroupMember(leagueId, groupId, oldUserId, newUserId) {
    try {
        await prisma.$transaction(async (tx) => {
            // Remove old
            await tx.groupMember.delete({
                where: {
                    userId_groupId: { userId: oldUserId, groupId }
                }
            })

            // Add new
            await tx.groupMember.create({
                data: {
                    userId: newUserId,
                    groupId
                }
            })
        })
        revalidatePath(`/admin/league/${leagueId}`)
        revalidatePath(`/league/${leagueId}`)
    } catch (e) {
        console.error("Failed to swap player:", e)
        throw e
    }
}

export async function updateGroupSchedule(leagueId, groupId, { day, time, court }) {
    try {
        await prisma.group.update({
            where: { id: groupId },
            data: {
                day,
                time,
                court
            }
        })
        revalidatePath(`/admin/league/${leagueId}`)
        revalidatePath(`/league/${leagueId}`)
    } catch (e) {
        console.error("Error updating group schedule:", e)
        throw e
    }
}

export async function movePlayerGroup(leagueId, currentGroupId, userId, direction) {
    try {
        const league = await prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                groups: {
                    orderBy: { tier: 'asc' },
                    include: {
                        members: true
                    }
                }
            }
        })

        if (!league) throw new Error("League not found")

        const currentWeek = league.currentWeek

        // Flatten all members for the current week into an ordered list
        const allMembers = []
        for (const group of league.groups) {
            const currentWeekMembers = group.members.filter(m => m.week === currentWeek)
            currentWeekMembers.sort((a, b) => a.rank - b.rank)
            for (const m of currentWeekMembers) {
                allMembers.push(m)
            }
        }

        const playerIndex = allMembers.findIndex(m => m.userId === userId && m.groupId === currentGroupId)
        if (playerIndex === -1) throw new Error("Player not found in current week")

        let targetIndex = playerIndex
        if (direction === 'up' && playerIndex > 0) {
            targetIndex = playerIndex - 1
        } else if (direction === 'down' && playerIndex < allMembers.length - 1) {
            targetIndex = playerIndex + 1
        }

        if (targetIndex === playerIndex) {
            throw new Error("Cannot move player further in that direction")
        }

        const player1 = allMembers[playerIndex]
        const player2 = allMembers[targetIndex]

        await prisma.$transaction(async (tx) => {
            // Swap player 1
            await tx.groupMember.update({
                where: { userId_groupId_week: { userId: player1.userId, groupId: player1.groupId, week: currentWeek } },
                data: {
                    groupId: player2.groupId,
                    rank: player2.rank
                }
            })
            // Use updateMany to avoid error if weekly score isn't explicitly seeded yet
            await tx.weeklyScore.updateMany({
                where: { userId: player1.userId, groupId: player1.groupId, week: currentWeek },
                data: { groupId: player2.groupId }
            })

            // Swap player 2
            await tx.groupMember.update({
                where: { userId_groupId_week: { userId: player2.userId, groupId: player2.groupId, week: currentWeek } },
                data: {
                    groupId: player1.groupId,
                    rank: player1.rank
                }
            })
            await tx.weeklyScore.updateMany({
                where: { userId: player2.userId, groupId: player2.groupId, week: currentWeek },
                data: { groupId: player1.groupId }
            })
        })

        revalidatePath(`/admin/league/${leagueId}`)
        revalidatePath(`/league/${leagueId}`)
        return { success: true }
    } catch (e) {
        console.error("Failed to move player:", e)
        throw e
    }
}

export async function updateLeagueStatus(leagueId, status) {
    try {
        await prisma.league.update({
            where: { id: leagueId },
            data: { status }
        })
        revalidatePath('/dashboard')
        revalidatePath(`/admin/league/${leagueId}`)
        revalidatePath(`/league/${leagueId}`)
        return { success: true }
    } catch (e) {
        console.error("Failed to update league status:", e)
        return { success: false, message: "Failed to update status." }
    }
}
