'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function createSession(data) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        const { coachId, date, durationMin, price, studentIds, isRecurring, recurringWeeks } = data

        const generateRecurringId = isRecurring ? 'rec_' + Math.random().toString(36).substring(2, 9) : null

        const weeksToCreate = isRecurring ? parseInt(recurringWeeks) || 1 : 1

        const sessionsToCreate = []

        for (let i = 0; i < weeksToCreate; i++) {
            // Calculate the date for week i
            const sessionDate = new Date(date)
            sessionDate.setDate(sessionDate.getDate() + (i * 7)) // Add 7 days per week

            const newSession = await prisma.coachingSession.create({
                data: {
                    coachId,
                    date: sessionDate,
                    durationMin: parseInt(durationMin) || 60,
                    price: parseFloat(price) || 0,
                    recurringId: generateRecurringId,
                    students: {
                        create: studentIds.map(id => ({ userId: id }))
                    }
                }
            })
            sessionsToCreate.push(newSession)
        }

        revalidatePath('/admin/coaching')
        revalidatePath('/coaching')

        return { success: true, count: sessionsToCreate.length }
    } catch (e) {
        console.error("Failed to create session(s):", e)
        return { success: false, error: e.message }
    }
}

export async function deleteSession(id) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') throw new Error("Unauthorized")

    try {
        await prisma.coachingSession.delete({
            where: { id }
        })

        revalidatePath('/admin/coaching')
        revalidatePath('/coaching')
        return { success: true }
    } catch (e) {
        console.error("Failed to delete session:", e)
        return { success: false, error: e.message }
    }
}
