'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl
            })

            if (res?.error) {
                setError('Invalid email or password')
                setLoading(false)
            } else {
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className={styles.card}>
            <h1 className={styles.title}>Sign In</h1>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.group}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                        placeholder="admin@admin.com"
                    />
                </div>

                <div className={styles.group}>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={styles.input}
                        placeholder="admin123"
                    />
                </div>

                <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className={styles.footer}>
                <p>Demo Admin: admin@admin.com / admin123</p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
