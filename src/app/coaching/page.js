import prisma from '@/lib/prisma'
import styles from './page.module.css'
import WeeklyCalendar from './WeeklyCalendar'

// Helper to get Sunday of current week
function getSunday(d) {
    const nd = new Date(d)
    const day = nd.getDay()
    nd.setDate(nd.getDate() - day)
    nd.setHours(0, 0, 0, 0)
    return nd
}

export default async function CoachingPublicPage() {
    const now = new Date()
    const sunday = getSunday(now)
    const thursday = new Date(sunday)
    thursday.setDate(thursday.getDate() + 5)
    thursday.setHours(23, 59, 59, 999)

    const initialSessions = await prisma.coachingSession.findMany({
        where: {
            date: {
                gte: sunday,
                lte: thursday
            }
        },
        orderBy: { date: 'asc' },
        include: {
            coach: true,
            students: {
                include: { user: { select: { id: true, name: true } } }
            }
        }
    })

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Coaching Schedule</h1>
                <p className={styles.subtitle}>Check out the upcoming sessions with our professional coaches.</p>
            </header>

            <main className={styles.main}>
                <WeeklyCalendar initialSessions={initialSessions} initialStartDate={now.toISOString()} />
            </main>
        </div>
    )
}
