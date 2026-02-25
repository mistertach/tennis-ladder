'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function CreateLeague() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        title: '',
        startDate: '',
        durationWeeks: 8,
        gamesPerMatch: 3
    })

    // Player Management State
    const [players, setPlayers] = useState([]) // Array of { id?, name, email?, level }
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [newPlayerName, setNewPlayerName] = useState('')
    const [newPlayerLevel, setNewPlayerLevel] = useState('BEGINNER')

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const res = await fetch(`/api/players/search?q=${encodeURIComponent(searchQuery)}`)
                    if (res.ok) {
                        const data = await res.json()
                        // Filter out already added players
                        const filtered = data.filter(p => !players.find(existing => existing.id === p.id))
                        setSearchResults(filtered)
                    }
                } catch (e) {
                    console.error(e)
                }
            } else {
                setSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, players]) // Re-run if players change to filter correctly

    const addExistingPlayer = (player) => {
        setPlayers([...players, player])
        setSearchQuery('')
        setSearchResults([])
    }

    const addNewPlayer = () => {
        if (!newPlayerName.trim()) return
        const newP = {
            id: `temp-${Date.now()}`, // Temp ID
            name: newPlayerName,
            level: newPlayerLevel,
            isNew: true
        }
        setPlayers([...players, newP])
        setNewPlayerName('')
        setNewPlayerLevel('BEGINNER')
    }

    const removePlayer = (index) => {
        const newP = [...players]
        newP.splice(index, 1)
        setPlayers(newP)
    }

    const movePlayer = (index, direction) => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === players.length - 1) return

        const newP = [...players]
        const temp = newP[index]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        newP[index] = newP[targetIndex]
        newP[targetIndex] = temp

        setPlayers(newP)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (players.length === 0) {
            setError('Please add at least 4 players.')
            setLoading(false)
            return
        }

        if (players.length % 4 !== 0) {
            setError(`Total players must be a multiple of 4. Current count: ${players.length}. You need ${4 - (players.length % 4)} more.`)
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/league', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    players // Send the structured array
                })
            })

            if (!res.ok) {
                throw new Error(await res.text())
            }

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Helper for badge class
    const getBadgeClass = (level) => styles[level.toLowerCase()] || ''

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Create New League</h1>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.group}>
                    <label>League Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className={styles.input}
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.group}>
                        <label>Start Date</label>
                        <input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.group}>
                        <label>Duration (Weeks)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.durationWeeks}
                            onChange={e => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
                            className={styles.input}
                        />
                    </div>
                </div>

                <div className={styles.group}>
                    <div className={styles.sectionTitle}>
                        <span>Player Management ({players.length})</span>
                        <span style={{ fontSize: '0.9rem', color: players.length % 4 === 0 ? 'green' : 'orange' }}>
                            {players.length % 4 === 0 ? 'Valid Count' : `Need ${4 - (players.length % 4)} more`}
                        </span>
                    </div>

                    <div className={styles.playerManager}>
                        {/* Search Existing */}
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="Search existing players..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.input}
                                style={{ flex: 1 }}
                            />
                            {searchResults.length > 0 && (
                                <div className={styles.searchResults}>
                                    {searchResults.map(p => (
                                        <div
                                            key={p.id}
                                            className={styles.searchResultItem}
                                            onClick={() => addExistingPlayer(p)}
                                        >
                                            <span>{p.name}</span>
                                            <span className={`${styles.badge} ${getBadgeClass(p.level)}`}>{p.level}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add New */}
                        <div className={styles.addPlayerForm}>
                            <input
                                type="text"
                                placeholder="New Player Name"
                                value={newPlayerName}
                                onChange={e => setNewPlayerName(e.target.value)}
                                className={styles.input}
                                style={{ flex: 2 }}
                            />
                            <select
                                value={newPlayerLevel}
                                onChange={e => setNewPlayerLevel(e.target.value)}
                                className={styles.select}
                                style={{ flex: 1 }}
                            >
                                <option value="BEGINNER">Beginner</option>
                                <option value="IMPROVER">Improver</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                            <button
                                type="button"
                                onClick={addNewPlayer}
                                className={styles.actionBtn}
                                style={{ background: 'var(--primary-color)', color: 'white', border: 'none' }}
                            >
                                Add
                            </button>
                        </div>

                        {/* Player List */}
                        <div className={styles.playerList}>
                            {players.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>
                                    No players added yet.
                                </div>
                            )}
                            {players.map((p, index) => (
                                <div key={p.id || index} className={styles.playerCard}>
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerRank}>{index + 1}</span>
                                        <div className={styles.playerName}>{p.name}</div>
                                        <span className={`${styles.badge} ${getBadgeClass(p.level)}`}>{p.level}</span>
                                    </div>
                                    <div className={styles.actions}>
                                        <button type="button" onClick={() => movePlayer(index, 'up')} className={styles.actionBtn} disabled={index === 0}>↑</button>
                                        <button type="button" onClick={() => movePlayer(index, 'down')} className={styles.actionBtn} disabled={index === players.length - 1}>↓</button>
                                        <button type="button" onClick={() => removePlayer(index)} className={`${styles.actionBtn} ${styles.removeBtn}`}>✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.hint} style={{ marginTop: '0.5rem' }}>
                        * Order matters! Players will be grouped based on this list (Top ranked together). Use arrows to reorder.
                    </div>
                </div>

                <div className={styles.group}>
                    <label>Games per Match</label>
                    <input
                        type="number"
                        min="1"
                        value={formData.gamesPerMatch}
                        onChange={e => setFormData({ ...formData, gamesPerMatch: parseInt(e.target.value) })}
                        className={styles.input}
                    />
                </div>

                <button type="submit" disabled={loading} className={styles.submit}>
                    {loading ? 'Creating...' : 'Create League & Generate Groups'}
                </button>
            </form>
        </div>
    )
}
