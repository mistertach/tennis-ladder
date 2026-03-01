import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import CoachesClient from "./CoachesClient"

export default async function CoachesPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        redirect('/')
    }

    const coaches = await prisma.coach.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Manage Coaches</h1>
            </div>
            <CoachesClient initialCoaches={coaches} />
        </div>
    )
}
