'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function createPlayer(data) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        // Simple email generator if none provided for a smooth flow.
        const email = data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@example.com`

        const isDtaBoardMember = data.isDtaBoardMember === true || data.isDtaBoardMember === 'true';
        const dtaJoinedDate = data.dtaJoinedDate && data.dtaJoinedDate !== '' ? new Date(data.dtaJoinedDate) : new Date('2025-01-01');
        const dtaExpiryDate = data.dtaExpiryDate && data.dtaExpiryDate !== '' ? new Date(data.dtaExpiryDate) : new Date('2026-12-31');

        const isDependent = data.isDependent === true || data.isDependent === 'true';
        const primaryMemberId = isDependent && data.primaryMemberId ? data.primaryMemberId : null;

        const newPlayer = await prisma.user.create({
            data: {
                name: data.name,
                email: email,
                password: data.password || 'password123', // Default dummy password
                level: data.level || 'BEGINNER',
                nationality: data.nationality === '' ? null : data.nationality,
                handedness: data.handedness === '' ? null : data.handedness,
                gender: data.gender === '' ? null : data.gender,
                isDtaBoardMember,
                dtaJoinedDate,
                dtaExpiryDate,
                badgeNumber: data.badgeNumber || null,
                isDependent,
                primaryMemberId,
                profileImage: data.profileImage || null,
                role: 'PLAYER'
            }
        })
        revalidatePath('/admin/players')
        return { success: true, player: newPlayer }
    } catch (e) {
        console.error("Failed to create player:", e)
        return { success: false, error: e.message }
    }
}

export async function updatePlayer(userId, data) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        const isDtaBoardMember = data.isDtaBoardMember === true || data.isDtaBoardMember === 'true';
        const dtaJoinedDate = data.dtaJoinedDate && data.dtaJoinedDate !== '' ? new Date(data.dtaJoinedDate) : null;
        const dtaExpiryDate = data.dtaExpiryDate && data.dtaExpiryDate !== '' ? new Date(data.dtaExpiryDate) : null;

        const isDependent = data.isDependent === true || data.isDependent === 'true';
        const primaryMemberId = isDependent && data.primaryMemberId ? data.primaryMemberId : null;

        const updatePayload = {
            name: data.name,
            email: data.email,
            level: data.level,
            nationality: data.nationality === '' ? null : data.nationality,
            handedness: data.handedness === '' ? null : data.handedness,
            gender: data.gender === '' ? null : data.gender,
            isDtaBoardMember,
            dtaJoinedDate,
            dtaExpiryDate,
            badgeNumber: data.badgeNumber || null,
            isDependent,
            primaryMemberId,
            profileImage: data.profileImage !== undefined ? data.profileImage : undefined,
        };

        console.log("=== UPDATING PLAYER PAYLOAD ===")
        console.log(updatePayload)
        console.log("Types:", {
            isDtaBoardMember: typeof isDtaBoardMember,
            dtaJoinedDate: dtaJoinedDate ? Object.prototype.toString.call(dtaJoinedDate) : 'null',
            dtaExpiryDate: dtaExpiryDate ? Object.prototype.toString.call(dtaExpiryDate) : 'null'
        })

        const updatedPlayer = await prisma.user.update({
            where: { id: userId },
            data: updatePayload
        })
        revalidatePath('/admin/players')
        return { success: true, player: updatedPlayer }
    } catch (e) {
        console.error("Failed to update player:", e)
        return { success: false, error: e.message }
    }
}

export async function deletePlayer(userId) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        // Because a player might have matches or scores, deleting them can cause issues if not cascaded.
        // Assuming we want a hard delete for now (prisma handles referential integrity, maybe we need to delete children first if missing cascade from User side)
        // GroupMember, WeeklyScore have User relation. Match has Player1/2.

        // Wait, Match model User relation does NOT have cascade in schema.prisma!
        // deleting user will fail if they have matches!

        // Let's check associations.
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                matchesAsPlayer1: { select: { id: true } },
                matchesAsPlayer2: { select: { id: true } },
            }
        })

        if (user.matchesAsPlayer1.length > 0 || user.matchesAsPlayer2.length > 0) {
            return { success: false, error: "Cannot delete player: They are assigned to matches. Remove them from leagues first." }
        }

        // Delete dependencies lacking Cascade first, or just try to delete User.
        // GroupMember and WeeklyScore relations DO NOT have cascade on user.id in schema.
        await prisma.$transaction(async (tx) => {
            await tx.weeklyScore.deleteMany({ where: { userId } })
            await tx.groupMember.deleteMany({ where: { userId } })
            // Sub requests
            await tx.substitutionRequest.deleteMany({ where: { requesterId: userId } })

            await tx.user.delete({ where: { id: userId } })
        })

        revalidatePath('/admin/players')
        return { success: true }
    } catch (e) {
        console.error("Failed to delete player:", e)
        return { success: false, error: e.message }
    }
}

export async function bulkRenewPlayers(userIds) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        const currentYear = new Date().getFullYear()
        const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59))

        await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { dtaExpiryDate: endOfYear }
        })

        revalidatePath('/admin/players')
        return { success: true }
    } catch (e) {
        console.error("Failed to bulk renew players:", e)
        return { success: false, error: e.message }
    }
}
