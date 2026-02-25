import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import styles from './page.module.css'
import ScoreForm from './ScoreForm'

export default async function ReportScorePage({ params }) {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect('/api/auth/signin')
    }

    const { id } = await params
    const match = await prisma.match.findUnique({
        where: { id },
        include: {
            player1: true,
            player2: true,
            group: {
                include: { league: true }
            }
        }
    })

    if (!match) {
        return <div>Match not found</div>
    }

    // Verify user is part of the match
    if (match.player1Id !== session.user.id && match.player2Id !== session.user.id) {
        return <div>You are not authorized to report scores for this match.</div>
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Report Score</h1>
            <div className={styles.subtitle}>
                {match.group.league.title} - {match.player1.name} vs {match.player2.name}
            </div>

            <div className={styles.card}>
                <ScoreForm match={match} userId={session.user.id} />
            </div>
        </div>
    )
}
