'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function createCoach(data) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        const coach = await prisma.coach.create({
            data: {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                bio: data.bio || null,
            }
        })
        revalidatePath('/admin/coaches')
        revalidatePath('/admin/coaching')
        revalidatePath('/coaching')
        return { success: true, coach }
    } catch (e) {
        console.error("Failed to create coach:", e)
        return { success: false, error: e.message }
    }
}

export async function updateCoach(id, data) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        const coach = await prisma.coach.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                bio: data.bio || null,
            }
        })
        revalidatePath('/admin/coaches')
        revalidatePath('/admin/coaching')
        revalidatePath('/coaching')
        return { success: true, coach }
    } catch (e) {
        console.error("Failed to update coach:", e)
        return { success: false, error: e.message }
    }
}

export async function deleteCoach(id) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        // First check if they have sessions
        const coach = await prisma.coach.findUnique({
            where: { id },
            include: { sessions: { select: { id: true } } }
        })

        if (coach.sessions.length > 0) {
            return { success: false, error: "Cannot delete coach because they have scheduled sessions. Please delete the sessions first." }
        }

        await prisma.coach.delete({ where: { id } })

        revalidatePath('/admin/coaches')
        revalidatePath('/admin/coaching')
        revalidatePath('/coaching')
        return { success: true }
    } catch (e) {
        console.error("Failed to delete coach:", e)
        return { success: false, error: e.message }
    }
}
