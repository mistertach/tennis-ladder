'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateWeeklyScore(groupId, userId, week, gamesWon) {
    try {
        await prisma.weeklyScore.upsert({
            where: {
                groupId_userId_week: {
                    groupId,
                    userId,
                    week
                }
            },
            update: {
                gamesWon,
                noShow: false // If entering score, they showed up
            },
            create: {
                groupId,
                userId,
                week,
                gamesWon,
                subNeeded: false,
                noShow: false
            }
        })
        // Optional: revalidatePath if needed immediately
    } catch (e) {
        console.error("Error updating weekly score:", e)
        throw e
    }
}

export async function toggleSubNeeded(groupId, userId, week, subNeeded) {
    try {
        await prisma.weeklyScore.upsert({
            where: {
                groupId_userId_week: {
                    groupId,
                    userId,
                    week
                }
            },
            update: { subNeeded },
            create: {
                groupId,
                userId,
                week,
                subNeeded,
                gamesWon: 0
            }
        })
        revalidatePath(`/league/${groupId}`)
    } catch (e) {
        throw e
    }
}

export async function updateNoShow(groupId, userId, week, noShow) {
    try {
        await prisma.weeklyScore.upsert({
            where: {
                groupId_userId_week: { groupId, userId, week }
            },
            update: {
                noShow,
                gamesWon: noShow ? 0 : undefined // Reset games if no show? Or keep? Let's zero it.
            },
            create: {
                groupId,
                userId,
                week,
                noShow,
                gamesWon: 0,
                subNeeded: false
            }
        })
        revalidatePath(`/league/${groupId}`)
    } catch (e) {
        console.error("Error updating no show:", e)
        throw e
    }
}

export async function updateSubDetails(groupId, userId, week, subName, subContact) {
    try {
        await prisma.weeklyScore.upsert({
            where: {
                groupId_userId_week: {
                    groupId,
                    userId,
                    week
                }
            },
            update: { subName, subContact },
            create: {
                groupId,
                userId,
                week,
                subName,
                subContact,
                subNeeded: true // Implicit since we are adding details
            }
        })
        revalidatePath(`/league/${groupId}`)
    } catch (e) {
        console.error("Error updating sub details:", e)
        throw e
    }
}

export async function updateGroupCourt(groupId, courtNumber) {
    try {
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            select: { leagueId: true }
        })

        await prisma.group.update({
            where: { id: groupId },
            data: {
                court: courtNumber
            }
        })

        if (group) {
            revalidatePath(`/league/${group.leagueId}`)
        }
    } catch (e) {
        console.error("Error updating court number:", e)
        throw e
    }
}

export async function updateGroupTime(groupId, time) {
    try {
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            select: { leagueId: true }
        })

        await prisma.group.update({
            where: { id: groupId },
            data: {
                time
            }
        })

        if (group) {
            revalidatePath(`/league/${group.leagueId}`)
        }
    } catch (e) {
        console.error("Error updating time:", e)
        throw e
    }
}
