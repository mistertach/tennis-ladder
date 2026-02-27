'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { getAllPlayers } from '@/app/admin/players/actions'

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

    // Bulk Select State
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
    const [allPlayersCache, setAllPlayersCache] = useState([])
    const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set())
    const [bulkLoading, setBulkLoading] = useState(false)

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

    const openBulkModal = async () => {
        setIsBulkModalOpen(true)
        if (allPlayersCache.length === 0) {
            setBulkLoading(true)
            const res = await getAllPlayers()
            if (res.success) {
                setAllPlayersCache(res.players)
            } else {
                alert('Failed to load players: ' + res.error)
            }
            setBulkLoading(false)
        }
    }

    const toggleBulkSelection = (id) => {
        const newSet = new Set(bulkSelectedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setBulkSelectedIds(newSet)
    }

    const handleBulkAdd = () => {
        const toAdd = allPlayersCache.filter(p => bulkSelectedIds.has(p.id) && !players.find(existing => existing.id === p.id))
        setPlayers([...players, ...toAdd])
        setIsBulkModalOpen(false)
        setBulkSelectedIds(new Set())
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
                    <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span>Player Management ({players.length})</span>
                            <span style={{ fontSize: '0.9rem', color: players.length % 4 === 0 ? 'green' : 'orange', marginLeft: '10px' }}>
                                {players.length % 4 === 0 ? 'Valid Count' : `Need ${4 - (players.length % 4)} more`}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={openBulkModal}
                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            + Bulk Select Players
                        </button>
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

            {/* Bulk Selection Modal */}
            {isBulkModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Bulk Add Players</h2>
                            <button onClick={() => setIsBulkModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {bulkLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading players...</div>
                        ) : (
                            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.5rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                        <tr>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Select</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Name</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Level</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allPlayersCache.map(p => {
                                            const isAlreadyAdded = players.some(existing => existing.id === p.id)
                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: isAlreadyAdded ? 'default' : 'pointer' }} onClick={() => !isAlreadyAdded && toggleBulkSelection(p.id)}>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={bulkSelectedIds.has(p.id)}
                                                            readOnly
                                                            disabled={isAlreadyAdded}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.5rem', color: isAlreadyAdded ? '#94a3b8' : 'inherit' }}>{p.name} {p.gender === 'FEMALE' ? '(F)' : p.gender === 'MALE' ? '(M)' : ''}</td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <span className={`${styles.badge} ${getBadgeClass(p.level)}`} style={{ opacity: isAlreadyAdded ? 0.5 : 1 }}>{p.level}</span>
                                                    </td>
                                                    <td style={{ padding: '0.5rem', fontSize: '0.8rem', color: isAlreadyAdded ? '#10b981' : '#94a3b8' }}>
                                                        {isAlreadyAdded ? 'Added' : ''}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{bulkSelectedIds.size} players selected</span>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsBulkModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                <button type="button" onClick={handleBulkAdd} disabled={bulkSelectedIds.size === 0} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: bulkSelectedIds.size === 0 ? 'not-allowed' : 'pointer', opacity: bulkSelectedIds.size === 0 ? 0.5 : 1 }}>
                                    Add Selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
