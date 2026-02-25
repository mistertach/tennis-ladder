'use client'

import { useState } from 'react'
import { createPlayer, updatePlayer, deletePlayer, bulkRenewPlayers } from '../actions'
import styles from '../page.module.css'

const COUNTRIES = [
    { code: '', label: '(No nationality specified)' },
    { code: '🇦🇷', label: 'Argentina 🇦🇷' },
    { code: '🇦🇺', label: 'Australia 🇦🇺' },
    { code: '🇦🇹', label: 'Austria 🇦🇹' },
    { code: '🇧🇪', label: 'Belgium 🇧🇪' },
    { code: '🇧🇷', label: 'Brazil 🇧🇷' },
    { code: '🇨🇦', label: 'Canada 🇨🇦' },
    { code: '🇨🇱', label: 'Chile 🇨🇱' },
    { code: '🇨🇳', label: 'China 🇨🇳' },
    { code: '🇨🇴', label: 'Colombia 🇨🇴' },
    { code: '🇭🇷', label: 'Croatia 🇭🇷' },
    { code: '🇨🇿', label: 'Czech Republic 🇨🇿' },
    { code: '🇩🇰', label: 'Denmark 🇩🇰' },
    { code: '🇪🇬', label: 'Egypt 🇪🇬' },
    { code: '🇫🇷', label: 'France 🇫🇷' },
    { code: '🇩🇪', label: 'Germany 🇩🇪' },
    { code: '🇬🇧', label: 'Great Britain 🇬🇧' },
    { code: '🇬🇷', label: 'Greece 🇬🇷' },
    { code: '🇮🇳', label: 'India 🇮🇳' },
    { code: '🇮🇪', label: 'Ireland 🇮🇪' },
    { code: '🇮🇱', label: 'Israel 🇮🇱' },
    { code: '🇮🇹', label: 'Italy 🇮🇹' },
    { code: '🇯🇵', label: 'Japan 🇯🇵' },
    { code: '🇰🇿', label: 'Kazakhstan 🇰🇿' },
    { code: '🇱🇻', label: 'Latvia 🇱🇻' },
    { code: '🇲🇽', label: 'Mexico 🇲🇽' },
    { code: '🇳🇱', label: 'Netherlands 🇳🇱' },
    { code: '🇳🇿', label: 'New Zealand 🇳🇿' },
    { code: '🇳🇴', label: 'Norway 🇳🇴' },
    { code: '🇵🇱', label: 'Poland 🇵🇱' },
    { code: '🇵🇹', label: 'Portugal 🇵🇹' },
    { code: '🇷🇴', label: 'Romania 🇷🇴' },
    { code: '🇷🇺', label: 'Russia 🇷🇺' },
    { code: '🇷🇸', label: 'Serbia 🇷🇸' },
    { code: '🇸🇰', label: 'Slovakia 🇸🇰' },
    { code: '🇿🇦', label: 'South Africa 🇿🇦' },
    { code: '🇰🇷', label: 'South Korea 🇰🇷' },
    { code: '🇪🇸', label: 'Spain 🇪🇸' },
    { code: '🇸🇪', label: 'Sweden 🇸🇪' },
    { code: '🇨🇭', label: 'Switzerland 🇨🇭' },
    { code: '🇹🇼', label: 'Taiwan 🇹🇼' },
    { code: '🇹🇳', label: 'Tunisia 🇹🇳' },
    { code: '🇺🇦', label: 'Ukraine 🇺🇦' },
    { code: '🇺🇸', label: 'United States 🇺🇸' }
];

export default function PlayerList({ initialPlayers }) {
    const [players, setPlayers] = useState(initialPlayers)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPlayer, setEditingPlayer] = useState(null)
    const [isRenewing, setIsRenewing] = useState(false)

    // Pagination
    const PAGE_SIZE = 20
    const [currentPage, setCurrentPage] = useState(1)

    // Selection
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([])

    // Derived State
    const totalPages = Math.ceil(players.length / PAGE_SIZE)
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const paginatedPlayers = players.slice(startIndex, startIndex + PAGE_SIZE)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        level: 'BEGINNER',
        nationality: '',
        handedness: '',
        gender: '',
        isDtaBoardMember: false,
        dtaJoinedDate: '',
        dtaExpiryDate: '',
        badgeNumber: '',
        isDependent: false,
        primaryMemberId: ''
    })

    const openAddModal = () => {
        setEditingPlayer(null)
        setFormData({
            name: '', email: '', level: 'BEGINNER', nationality: '', handedness: '', gender: '',
            isDtaBoardMember: false,
            dtaJoinedDate: '2025-01-01',
            dtaExpiryDate: '2026-12-31',
            badgeNumber: '',
            isDependent: false,
            primaryMemberId: ''
        })
        setIsModalOpen(true)
    }

    const openEditModal = (player) => {
        setEditingPlayer(player)
        setFormData({
            name: player.name || '',
            email: player.email || '',
            level: player.level || 'BEGINNER',
            nationality: player.nationality || '',
            handedness: player.handedness || '',
            gender: player.gender || '',
            isDtaBoardMember: player.isDtaBoardMember || false,
            dtaJoinedDate: player.dtaJoinedDate ? new Date(player.dtaJoinedDate).toISOString().split('T')[0] : '',
            dtaExpiryDate: player.dtaExpiryDate ? new Date(player.dtaExpiryDate).toISOString().split('T')[0] : '',
            badgeNumber: player.badgeNumber || '',
            isDependent: player.isDependent || false,
            primaryMemberId: player.primaryMemberId || ''
        })
        setIsModalOpen(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()

        let res
        if (editingPlayer) {
            res = await updatePlayer(editingPlayer.id, {
                ...formData,
                nationality: formData.nationality || null,
                handedness: formData.handedness || null,
                gender: formData.gender || null
            })
            if (res.success) {
                setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, ...res.player } : p))
            }
        } else {
            res = await createPlayer({
                ...formData,
                nationality: formData.nationality || null,
                handedness: formData.handedness || null,
                gender: formData.gender || null
            })
            if (res.success) {
                // Approximate counts for UI
                const newP = { ...res.player, _count: { matchesAsPlayer1: 0, matchesAsPlayer2: 0, weeklyScores: 0 } }
                setPlayers([...players, newP].sort((a, b) => a.name.localeCompare(b.name)))
            }
        }

        if (res.success) {
            setIsModalOpen(false)
        } else {
            alert(res.error || "Failed to save player.")
        }
    }

    const handleDelete = async (id) => {
        if (!process.browser && !window.confirm("Are you sure you want to permanently delete this player? This might fail if they are scheduled in matches.")) return

        const res = await deletePlayer(id)
        if (res.success) {
            setPlayers(players.filter(p => p.id !== id))
        } else {
            alert(res.error || "Failed to delete.")
        }
    }

    const handleBulkRenew = async () => {
        if (!confirm(`Are you sure you want to renew memberships for ${selectedPlayerIds.length} players until the end of the year?`)) return;
        setIsRenewing(true)
        const res = await bulkRenewPlayers(selectedPlayerIds)
        setIsRenewing(false)
        if (res.success) {
            const currentYear = new Date().getFullYear();
            const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));
            setPlayers(players.map(p => selectedPlayerIds.includes(p.id) ? { ...p, dtaExpiryDate: endOfYear } : p));
            setSelectedPlayerIds([]); // Clear selection after success
            alert("Successfully renewed memberships!");
        } else {
            alert(res.error || "Failed to bulk renew.");
        }
    }

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPlayerIds(paginatedPlayers.map(p => p.id))
        } else {
            setSelectedPlayerIds([])
        }
    }

    const togglePlayerSelect = (id) => {
        if (selectedPlayerIds.includes(id)) {
            setSelectedPlayerIds(selectedPlayerIds.filter(pid => pid !== id))
        } else {
            setSelectedPlayerIds([...selectedPlayerIds, id])
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button className={styles.addButton} onClick={openAddModal}>+ Add New Player</button>
                {selectedPlayerIds.length > 0 && (
                    <button
                        className={styles.actionButton}
                        style={{ background: '#3498db' }}
                        onClick={handleBulkRenew}
                        disabled={isRenewing}
                    >
                        {isRenewing ? 'Renewing...' : `Bulk Renew (${selectedPlayerIds.length})`}
                    </button>
                )}
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.playerTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={paginatedPlayers.length > 0 && paginatedPlayers.every(p => selectedPlayerIds.includes(p.id))}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th>Name</th>
                            <th>Level</th>
                            <th>Nationality</th>
                            <th>Handedness</th>
                            <th>Gen</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPlayers.map(p => (
                            <tr key={p.id}>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPlayerIds.includes(p.id)}
                                        onChange={() => togglePlayerSelect(p.id)}
                                    />
                                </td>
                                <td>
                                    {p.name} {p.email ? `<${p.email}>` : ''}
                                    {p.dtaExpiryDate && <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Expires: {new Date(p.dtaExpiryDate).toLocaleDateString()}</div>}
                                </td>
                                <td>{p.level}</td>
                                <td>{p.nationality || '-'}</td>
                                <td>{p.handedness || '-'}</td>
                                <td>{p.gender ? (p.gender === 'MALE' ? 'M' : 'F') : '-'}</td>
                                <td>
                                    <button className={`${styles.actionButton} ${styles.edit}`} onClick={() => openEditModal(p)}>Edit</button>
                                    <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => handleDelete(p.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {paginatedPlayers.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>No players found. Add some!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        className={styles.actionButton}
                        style={{ background: '#7f8c8d' }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        className={styles.actionButton}
                        style={{ background: '#7f8c8d' }}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>{editingPlayer ? 'Edit Player' : 'Add Player'}</h2>
                        <form onSubmit={handleSave}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email (Optional)</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Level</label>
                                <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                    <option value="BEGINNER">BEGINNER</option>
                                    <option value="IMPROVER">IMPROVER</option>
                                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                                    <option value="ADVANCED">ADVANCED</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Nationality</label>
                                <select value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })}>
                                    {COUNTRIES.map(c => (
                                        <option key={c.label} value={c.code}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Handedness</label>
                                <select value={formData.handedness} onChange={e => setFormData({ ...formData, handedness: e.target.value })}>
                                    <option value="">(None specified)</option>
                                    <option value="RIGHT">RIGHT</option>
                                    <option value="LEFT">LEFT</option>
                                    <option value="AMBIDEXTROUS">AMBIDEXTROUS</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Gender</label>
                                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="">(None specified)</option>
                                    <option value="MALE">MALE</option>
                                    <option value="FEMALE">FEMALE</option>
                                </select>
                            </div>
                            <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="dtaBoard"
                                    checked={formData.isDtaBoardMember}
                                    onChange={e => setFormData({ ...formData, isDtaBoardMember: e.target.checked })}
                                    style={{ width: 'auto' }}
                                />
                                <label htmlFor="dtaBoard" style={{ margin: 0 }}>DTA Board Member</label>
                            </div>
                            <div className={styles.formGroup}>
                                <label>DTA Joined Date</label>
                                <input
                                    type="date"
                                    value={formData.dtaJoinedDate}
                                    onChange={e => setFormData({ ...formData, dtaJoinedDate: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>DTA Expiry Date</label>
                                <input
                                    type="date"
                                    value={formData.dtaExpiryDate}
                                    onChange={e => setFormData({ ...formData, dtaExpiryDate: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Badge Number</label>
                                <input
                                    type="text"
                                    value={formData.badgeNumber}
                                    onChange={e => setFormData({ ...formData, badgeNumber: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="isDependent"
                                    checked={formData.isDependent}
                                    onChange={e => setFormData({ ...formData, isDependent: e.target.checked })}
                                    style={{ width: 'auto' }}
                                />
                                <label htmlFor="isDependent" style={{ margin: 0 }}>Dependent</label>
                            </div>

                            {formData.isDependent && (
                                <div className={styles.formGroup}>
                                    <label>Primary Member</label>
                                    <select
                                        value={formData.primaryMemberId}
                                        onChange={e => setFormData({ ...formData, primaryMemberId: e.target.value })}
                                        required={formData.isDependent}
                                    >
                                        <option value="">Select Primary Member</option>
                                        {initialPlayers
                                            .filter(p => !editingPlayer || p.id !== editingPlayer.id)
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveButton}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
