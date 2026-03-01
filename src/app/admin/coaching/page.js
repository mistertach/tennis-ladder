import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import CoachingClient from "./CoachingClient"

export default async function AdminCoachingPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        redirect('/')
    }

    const coaches = await prisma.coach.findMany({
        orderBy: { name: 'asc' }
    })

    const players = await prisma.user.findMany({
        where: { role: 'PLAYER' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, level: true, email: true }
    })

    const upcomingSessions = await prisma.coachingSession.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        include: {
            coach: true,
            students: {
                include: { user: { select: { id: true, name: true } } }
            }
        }
    })

    // Calculate basic financial summary (e.g. total generated from all future sessions)
    const totalExpectedRevenue = upcomingSessions.reduce((sum, s) => sum + s.price, 0)

    // Total from past 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const pastSessions = await prisma.coachingSession.findMany({
        where: {
            date: {
                gte: thirtyDaysAgo,
                lt: new Date()
            }
        },
        select: { price: true }
    })

    const past30DaysRevenue = pastSessions.reduce((sum, s) => sum + s.price, 0)

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Manage Coaching Schedule</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Past 30 Days Revenue</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '0.5rem' }}>{past30DaysRevenue} SAR</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Future Expected Revenue</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '0.5rem' }}>{totalExpectedRevenue} SAR</div>
                </div>
            </div>

            <CoachingClient
                coaches={coaches}
                players={players}
                initialSessions={upcomingSessions}
            />
        </div>
    )
}
