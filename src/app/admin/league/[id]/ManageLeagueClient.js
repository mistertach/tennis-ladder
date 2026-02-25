'use client'

import { useState } from 'react'
import { generateNextWeek, regenerateCurrentWeek, swapGroupMember, updateGroupSchedule, movePlayerGroup, updateLeagueStatus } from '@/app/league/[id]/adminActions'
import { createPlayer } from '@/app/admin/players/actions'
import { useRouter } from 'next/navigation'

export default function ManageLeagueClient({ league, allUsers }) {
    const router = useRouter()
    const [generating, setGenerating] = useState(false)
    const [swapping, setSwapping] = useState(null) // { groupId, userId }
    const [selectedNewUser, setSelectedNewUser] = useState('')
    const [isCreatingNewPlayer, setIsCreatingNewPlayer] = useState(false)
    const [newPlayerDetails, setNewPlayerDetails] = useState({ name: '', level: 'BEGINNER' })
    const [editingSchedule, setEditingSchedule] = useState(null) // { groupId, day, time, court }

    const handleGenerateNext = async (isRainDelay) => {
        if (!confirm(`Are you sure you want to generate Week ${league.currentWeek + 1}? ${isRainDelay ? '(RAIN DELAY MODE)' : ''}`)) return

        setGenerating(true)
        try {
            const res = await generateNextWeek(league.id, { isRainDelay })
            if (res.success) {
                alert('Success!')
                router.refresh()
            } else {
                alert('Error: ' + res.message)
            }
        } catch (e) {
            console.error(e)
            alert('Failed to generate.')
        } finally {
            setGenerating(false)
        }
    }

    const handleRegenerateCurrent = async () => {
        if (!confirm(`Are you sure you want to REGENERATE the CURRENT Week ${league.currentWeek}? This will reset all match scores reported for this week.`)) return

        setGenerating(true)
        try {
            const res = await regenerateCurrentWeek(league.id)
            if (res.success) {
                alert('Current week regenerated successfully!')
                router.refresh()
            } else {
                alert('Error: ' + res.message)
            }
        } catch (e) {
            console.error(e)
            alert('Failed to regenerate.')
        } finally {
            setGenerating(false)
        }
    }

    const handleSwap = async (groupId, oldUserId) => {
        let replacementId = selectedNewUser

        if (isCreatingNewPlayer) {
            if (!newPlayerDetails.name.trim()) return alert('Please enter a player name')
            if (!confirm(`Are you sure you want to create and swap in new player: ${newPlayerDetails.name}?`)) return

            // Note: We need to hit an API or action to create the user first. 
            // We'll create a quick fetch to our internal api/players if we had one, or a new server action here.
            // Since we have createPlayer in admin/players/actions, let's just make an ad-hoc fetch to an API route
            // or we'd ideally import that action. Wait, server actions are imported! However, we need to import createPlayer.
            // Let's assume we can hit the same API used in create league, or we can just import createPlayer.
        } else {
            if (!selectedNewUser) return alert('Please select a user')
            if (!confirm('Are you sure you want to replace this player?')) return
        }

        try {
            if (isCreatingNewPlayer) {
                const createRes = await createPlayer(newPlayerDetails)
                if (!createRes.success) throw new Error(createRes.error)
                replacementId = createRes.player.id
            }

            await swapGroupMember(league.id, groupId, oldUserId, replacementId)
            setSwapping(null)
            setSelectedNewUser('')
            setIsCreatingNewPlayer(false)
            setNewPlayerDetails({ name: '', level: 'BEGINNER' })
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Failed to swap player: ' + e.message)
        }
    }

    const handleMove = async (groupId, userId, direction) => {
        try {
            await movePlayerGroup(league.id, groupId, userId, direction)
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Failed to move player. Note: you cannot move a player beyond the top or bottom groups.')
        }
    }

    const handleScheduleSave = async (groupId) => {
        if (!editingSchedule) return
        try {
            await updateGroupSchedule(league.id, groupId, {
                day: editingSchedule.day,
                time: editingSchedule.time,
                court: editingSchedule.court
            })
            setEditingSchedule(null)
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Failed to save schedule')
        }
    }

    // Calculate global linear ranking to properly disable arrows for absolute first/last players
    const globalMembers = []
    league.groups.forEach(group => {
        const sorted = [...group.members].sort((a, b) => a.rank - b.rank)
        sorted.forEach(m => globalMembers.push(m.userId))
    })

    return (
        <div>
            <div style={{ margin: '2rem 0', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', background: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Week Management</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong>League Status:</strong>
                        <select
                            value={league.status}
                            onChange={async (e) => {
                                const newStatus = e.target.value;
                                if (confirm(`Change league status to ${newStatus}?`)) {
                                    setGenerating(true)
                                    await updateLeagueStatus(league.id, newStatus)
                                    setGenerating(false)
                                    router.refresh()
                                }
                            }}
                            disabled={generating}
                            style={{ padding: '0.5rem', borderRadius: '4px' }}
                        >
                            <option value="DRAFT">DRAFT</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="COMPLETED">COMPLETED</option>
                        </select>
                    </div>
                </div>
                <p>Generate the next week's schedule. This will apply promotion/demotion logic and rearrange groups.</p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <button
                        onClick={() => handleGenerateNext(false)}
                        disabled={generating}
                        style={{
                            background: '#0070f3', color: 'white', padding: '0.75rem 1.5rem',
                            border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        {generating ? 'Processing...' : `Generate NEXT Week (${league.currentWeek + 1})`}
                    </button>

                    <button
                        onClick={handleRegenerateCurrent}
                        disabled={generating}
                        style={{
                            background: '#ef4444', color: 'white', padding: '0.75rem 1.5rem',
                            border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        {generating ? 'Processing...' : `Regenerate CURRENT Week (${league.currentWeek})`}
                    </button>

                    <button
                        onClick={() => handleGenerateNext(true)}
                        disabled={generating}
                        style={{
                            background: '#2196f3', color: 'white', padding: '0.75rem 1.5rem',
                            border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        {generating ? 'Processing...' : `Rain Delay (Copy to Week ${league.currentWeek + 1})`}
                    </button>
                </div>
            </div>

            <h2>Group Management</h2>
            <div style={{ display: 'grid', gap: '2rem' }}>
                {league.groups.map(group => (
                    <div key={group.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Group {group.tier}</h3>
                            {editingSchedule?.groupId === group.id ? (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        placeholder="Day (e.g. Monday)"
                                        value={editingSchedule.day}
                                        onChange={(e) => setEditingSchedule({ ...editingSchedule, day: e.target.value })}
                                        style={{ padding: '0.25rem' }}
                                    />
                                    <input
                                        placeholder="Time (e.g. 6pm)"
                                        value={editingSchedule.time}
                                        onChange={(e) => setEditingSchedule({ ...editingSchedule, time: e.target.value })}
                                        style={{ padding: '0.25rem', width: '80px' }}
                                    />
                                    <input
                                        placeholder="Court (e.g. 1 & 2)"
                                        value={editingSchedule.court}
                                        onChange={(e) => setEditingSchedule({ ...editingSchedule, court: e.target.value })}
                                        style={{ padding: '0.25rem', width: '80px' }}
                                    />
                                    <button onClick={() => handleScheduleSave(group.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                                    <button onClick={() => setEditingSchedule(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                        {group.day || 'No Day'} @ {group.time || 'No Time'} (Court {group.court || '?'})
                                    </span>
                                    <button
                                        onClick={() => setEditingSchedule({ groupId: group.id, day: group.day || '', time: group.time || '', court: group.court || '' })}
                                        style={{ background: '#f3f4f6', border: '1px solid #ddd', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        Edit Schedule
                                    </button>
                                </div>
                            )}
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    <th style={{ padding: '0.5rem' }}>Player</th>
                                    <th style={{ padding: '0.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...group.members].sort((a, b) => a.rank - b.rank).map(member => {
                                    const globalIndex = globalMembers.indexOf(member.userId)
                                    const isFirstOverall = globalIndex === 0
                                    const isLastOverall = globalIndex === globalMembers.length - 1

                                    return (
                                        <tr key={member.userId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                            <td style={{ padding: '0.5rem' }}>{member.user.name} <span style={{ color: '#888', fontSize: '0.8rem' }}>(Rank {member.rank})</span></td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {swapping?.groupId === group.id && swapping?.userId === member.userId ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px' }}>
                                                        <select
                                                            value={selectedNewUser}
                                                            onChange={(e) => setSelectedNewUser(e.target.value)}
                                                            style={{ padding: '0.25rem' }}
                                                        >
                                                            <option value="">Select Replacement</option>
                                                            {allUsers
                                                                .filter(u => !group.members.find(m => m.userId === u.id)) // Filter out current group members
                                                                .map(u => (
                                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                                ))
                                                            }
                                                        </select>
                                                        <button onClick={() => setIsCreatingNewPlayer(true)} style={{ fontSize: '0.8rem', background: 'none', border: '1px solid #ccc', cursor: 'pointer', padding: '0.25rem' }}>+ New Player</button>

                                                        <button onClick={() => handleSwap(group.id, member.userId)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Confirm</button>
                                                        <button onClick={() => { setSwapping(null); setIsCreatingNewPlayer(false); setNewPlayerDetails({ name: '', level: 'BEGINNER', nationality: '', handedness: '', gender: '', isDtaBoardMember: false, dtaJoinedDate: '2025-01-01', dtaExpiryDate: '2026-12-31', badgeNumber: '', isDependent: false, primaryMemberId: '' }); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <button
                                                            onClick={() => setSwapping({ groupId: group.id, userId: member.userId })}
                                                            style={{ border: '1px solid #ddd', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                                                        >
                                                            Replace
                                                        </button>
                                                        <button
                                                            onClick={() => handleMove(group.id, member.userId, 'up')}
                                                            disabled={isFirstOverall}
                                                            title="Move UP one rank position"
                                                            style={{ border: '1px solid #ddd', background: isFirstOverall ? '#eee' : 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: isFirstOverall ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                                                        >
                                                            ▲
                                                        </button>
                                                        <button
                                                            onClick={() => handleMove(group.id, member.userId, 'down')}
                                                            disabled={isLastOverall}
                                                            title="Move DOWN one rank position"
                                                            style={{ border: '1px solid #ddd', background: isLastOverall ? '#eee' : 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: isLastOverall ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                                                        >
                                                            ▼
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {isCreatingNewPlayer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px' }}>
                        <h2>Create New Player</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Name</label>
                                <input style={{ width: '100%', padding: '0.5rem' }} required value={newPlayerDetails.name} onChange={e => setNewPlayerDetails({ ...newPlayerDetails, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Level</label>
                                <select style={{ width: '100%', padding: '0.5rem' }} value={newPlayerDetails.level} onChange={e => setNewPlayerDetails({ ...newPlayerDetails, level: e.target.value })}>
                                    <option value="BEGINNER">BEGINNER</option>
                                    <option value="IMPROVER">IMPROVER</option>
                                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                                    <option value="ADVANCED">ADVANCED</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Gender</label>
                                <select style={{ width: '100%', padding: '0.5rem' }} value={newPlayerDetails.gender || ''} onChange={e => setNewPlayerDetails({ ...newPlayerDetails, gender: e.target.value })}>
                                    <option value="">(None specified)</option>
                                    <option value="MALE">MALE</option>
                                    <option value="FEMALE">FEMALE</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="dtaBoardLeague"
                                    checked={newPlayerDetails.isDtaBoardMember}
                                    onChange={e => setNewPlayerDetails({ ...newPlayerDetails, isDtaBoardMember: e.target.checked })}
                                />
                                <label htmlFor="dtaBoardLeague" style={{ margin: 0 }}>DTA Board Member</label>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>DTA Joined Date</label>
                                <input style={{ width: '100%', padding: '0.5rem' }} type="date" value={newPlayerDetails.dtaJoinedDate} onChange={e => setNewPlayerDetails({ ...newPlayerDetails, dtaJoinedDate: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>DTA Expiry Date</label>
                                <input style={{ width: '100%', padding: '0.5rem' }} type="date" value={newPlayerDetails.dtaExpiryDate} onChange={e => setNewPlayerDetails({ ...newPlayerDetails, dtaExpiryDate: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Badge Number</label>
                                <input style={{ width: '100%', padding: '0.5rem' }} type="text" value={newPlayerDetails.badgeNumber || ''} onChange={e => setNewPlayerDetails({ ...newPlayerDetails, badgeNumber: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="dependentLeague"
                                    checked={newPlayerDetails.isDependent}
                                    onChange={e => setNewPlayerDetails({ ...newPlayerDetails, isDependent: e.target.checked })}
                                />
                                <label htmlFor="dependentLeague" style={{ margin: 0 }}>Dependent</label>
                            </div>
                            {newPlayerDetails.isDependent && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>Primary Member</label>
                                    <select
                                        style={{ width: '100%', padding: '0.5rem' }}
                                        value={newPlayerDetails.primaryMemberId || ''}
                                        onChange={e => setNewPlayerDetails({ ...newPlayerDetails, primaryMemberId: e.target.value })}
                                    >
                                        <option value="">Select Primary Member</option>
                                        {allUsers.sort((a, b) => a.name.localeCompare(b.name)).map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsCreatingNewPlayer(false)} style={{ padding: '0.5rem 1rem', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={() => handleSwap(swapping.groupId, swapping.userId)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create & Swap</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
