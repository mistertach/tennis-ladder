'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function ScoreForm({ match, userId }) {
    const router = useRouter()
    const [scoreP1, setScoreP1] = useState(match.scorePlayer1 || 0)
    const [scoreP2, setScoreP2] = useState(match.scorePlayer2 || 0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isPlayer1 = match.player1Id === userId

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/match/${match.id}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scorePlayer1: parseInt(scoreP1),
                    scorePlayer2: parseInt(scoreP2)
                })
            })

            if (!res.ok) {
                throw new Error('Failed to update score')
            }

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            setError('Error updating score. Please try again.')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.matchup}>
                <div className={styles.playerInput}>
                    <label>{match.player1.name}</label>
                    <input
                        type="number"
                        min="0"
                        max="3"
                        value={scoreP1}
                        onChange={e => setScoreP1(e.target.value)}
                        className={styles.scoreInput}
                    />
                </div>
                <div className={styles.vs}>VS</div>
                <div className={styles.playerInput}>
                    <label>{match.player2.name}</label>
                    <input
                        type="number"
                        min="0"
                        max="3"
                        value={scoreP2}
                        onChange={e => setScoreP2(e.target.value)}
                        className={styles.scoreInput}
                    />
                </div>
            </div>

            <div className={styles.info}>
                Enter the set score (e.g., 2-1 or 3-0 depending on rules).
            </div>

            <button type="submit" disabled={loading} className={styles.button}>
                {loading ? 'Submitting...' : 'Submit Score'}
            </button>

            <button
                type="button"
                onClick={() => router.back()}
                className={styles.secondaryButton}
                style={{ marginTop: '1rem' }}
            >
                Cancel
            </button>
        </form>
    )
}
