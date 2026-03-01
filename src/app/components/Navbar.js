'use client'

import Link from 'next/link'
import styles from './Navbar.module.css'
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
    const { data: session } = useSession()

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.logo} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link href="/">Tennis League</Link>
                    <Link href="/coaching" style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-color)' }}>Coaching</Link>
                </div>
                <div className={styles.links}>
                    {session ? (
                        <>
                            <Link href="/dashboard" className={styles.link}>Dashboard</Link>
                            {session.user?.role === 'ADMIN' && (
                                <Link href="/admin/league/new" className={styles.link}>Create League</Link>
                            )}
                            <button onClick={() => signOut()} className={styles.button}>Sign Out</button>
                        </>
                    ) : (
                        <Link href="/api/auth/signin" className={styles.button}>Admin access</Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
