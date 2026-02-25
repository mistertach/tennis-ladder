import prisma from "@/lib/prisma"
import styles from './page.module.css'
import PlayerList from './components/PlayerList'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function PlayersAdminPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        redirect('/')
    }

    const players = await prisma.user.findMany({
        where: { role: 'PLAYER' },
        orderBy: { name: 'asc' }
    })

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Player Management</h1>
                <p>Add, edit, and delete players. Add nationality flags and handedness.</p>
            </header>

            <main className={styles.main}>
                <PlayerList initialPlayers={players} />
            </main>
        </div>
    )
}
