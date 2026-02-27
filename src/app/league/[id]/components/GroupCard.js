'use client'

import { useState } from 'react'
import { updateWeeklyScore, toggleSubNeeded, updateSubDetails, updateNoShow } from '../actions'
import styles from './GroupCard.module.css'
import { calculateGroupStandings } from '@/lib/ranking'

export default function GroupCard({ group, week, scores, totalTiers, gamesPerMatch = 7, startingRank = 0, allUsers = [] }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [editMode, setEditMode] = useState(null) // 'SUB' or 'SCORE'
    const [localScores, setLocalScores] = useState(scores || [])

    const isTopGroup = group.tier === 1

    const rankedMembers = calculateGroupStandings(
        group.members,
        localScores,
        group.matches || [], // Pass matches for tie-breaker
        group.tier, // Use numeric tier
        totalTiers
    )

    const handleScoreUpdate = (userId, field, value) => {
        setLocalScores(prev => {
            const existing = prev.find(s => s.userId === userId)
            if (existing) {
                return prev.map(s => s.userId === userId ? { ...s, [field]: value } : s)
            } else {
                return [...prev, { userId, gamesWon: null, subNeeded: false, noShow: false, [field]: value }]
            }
        })
    }

    // Validation Logic
    const isGroupComplete = group.members.every(m => {
        const score = localScores.find(s => s.userId === m.userId)
        // Complete if: gamesWon is not null OR noShow is true
        return score && (score.gamesWon !== null || score.noShow)
    })

    const totalGamesRecorded = localScores.reduce((sum, s) => sum + (s.gamesWon || 0), 0)
    const n = group.members.length
    const expectedTotal = (n * (n - 1) / 2) * gamesPerMatch

    // Warning if complete and total games mismatch (and no No-Shows)
    const hasNoShow = localScores.some(s => s.noShow)
    const showWarning = isGroupComplete && !hasNoShow && totalGamesRecorded !== expectedTotal && n > 1

    // Max possible score for a player: gamesPerMatch * (number of opponents)
    const maxPossibleScore = gamesPerMatch * Math.max(0, n - 1)

    return (
        <div className={styles.group} onClick={() => !isExpanded && setIsExpanded(true)} style={{ cursor: isExpanded ? 'default' : 'pointer' }}>
            <div className={styles.groupHead} style={{ justifyContent: 'space-between', display: 'flex' }}>
                <div>
                    Group {group.tier}
                    {showWarning && (
                        <span style={{ fontSize: '0.6em', color: 'orange', marginLeft: '10px' }} title={`Total games should be ${expectedTotal}`}>
                            ⚠️ Check Totals ({totalGamesRecorded}/{expectedTotal})
                        </span>
                    )}
                </div>
                {isExpanded && (
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setEditMode(null); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                )}
            </div>

            <div className={styles.dayNcourt}>
                {group.day && <span className={styles.tag}>{group.day}</span>}
                {group.time && <span className={styles.tagHighlight}>{group.time}</span>}
                {group.court && <span className={styles.tag}>Court {group.court}</span>}
            </div>

            <div className={styles.playerList}>
                {rankedMembers.map((member, index) => {
                    const score = localScores.find(s => s.userId === member.userId)
                    return (
                        <PlayerRow
                            key={member.userId}
                            member={member}
                            score={score}
                            week={week}
                            groupId={group.id}
                            editMode={editMode}
                            onUpdate={handleScoreUpdate}
                            showArrows={isGroupComplete}
                            maxPossibleScore={maxPossibleScore}
                            displayRank={startingRank + member.rank}
                            allUsers={allUsers}
                        />
                    )
                })}
            </div>

            {isExpanded && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                    {editMode !== 'SCORE' && (
                        <button
                            className={styles.reportButton}
                            style={{ backgroundColor: editMode === 'SUB' ? '#0f172a' : '#3b82f6', flex: 1, marginTop: 0 }}
                            onClick={(e) => { e.stopPropagation(); setEditMode(editMode === 'SUB' ? null : 'SUB'); }}
                        >
                            {editMode === 'SUB' ? 'Cancel' : 'Report Sub'}
                        </button>
                    )}

                    {editMode === 'SUB' ? (
                        <button
                            className={styles.reportButton}
                            style={{ backgroundColor: '#10b981', flex: 1, marginTop: 0 }}
                            onClick={(e) => { e.stopPropagation(); setEditMode(null); }}
                        >
                            Save
                        </button>
                    ) : editMode === 'SCORE' ? (
                        <button
                            className={styles.reportButton}
                            style={{ backgroundColor: '#10b981', flex: 1, marginTop: 0 }}
                            onClick={(e) => { e.stopPropagation(); setEditMode(null); }}
                        >
                            Save
                        </button>
                    ) : (
                        <button
                            className={styles.reportButton}
                            style={{ backgroundColor: '#10b981', flex: 1, marginTop: 0 }}
                            onClick={(e) => { e.stopPropagation(); setEditMode('SCORE'); }}
                        >
                            Report Scores
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

function PlayerRow({ member, score, week, groupId, editMode, onUpdate, showArrows, maxPossibleScore, displayRank, allUsers }) {
    const subNeeded = score?.subNeeded || false
    // Default to null if undefined, so we can detect "not played"
    const gamesWon = score?.gamesWon ?? null
    const noShow = score?.noShow || false

    // Sub Details State
    const [subName, setSubName] = useState(score?.subName || '')
    const [subContact, setSubContact] = useState(score?.subContact || '')

    const handleSubToggle = async () => {
        if (editMode !== 'SUB') return
        const newState = !subNeeded
        onUpdate(member.userId, 'subNeeded', newState)

        try {
            await toggleSubNeeded(groupId, member.userId, week, newState)
        } catch (e) {
            console.error(e)
            onUpdate(member.userId, 'subNeeded', !newState)
        }
    }

    const handleNoShowToggle = async () => {
        if (editMode !== 'SCORE') return
        const newState = !noShow

        onUpdate(member.userId, 'noShow', newState)
        if (newState) {
            onUpdate(member.userId, 'gamesWon', 0)
        }

        try {
            await updateNoShow(groupId, member.userId, week, newState)
        } catch (e) {
            console.error(e)
            onUpdate(member.userId, 'noShow', !newState)
        }
    }

    const handleScoreChange = async (e) => {
        const rawVal = e.target.value
        const val = rawVal === '' ? null : parseInt(rawVal)

        onUpdate(member.userId, 'gamesWon', val)

        try {
            await updateWeeklyScore(groupId, member.userId, week, val)
        } catch (e) {
            console.error(e)
        }
    }

    const handleSubInfoBlur = async () => {
        try {
            await updateSubDetails(groupId, member.userId, week, subName, subContact)
        } catch (e) {
            console.error(e)
        }
    }

    const scoreOptions = Array.from({ length: (maxPossibleScore || 21) + 1 }, (_, i) => i)

    const getInitials = (name) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <div className={styles.playerRow}>
            <div className={styles.rankCell}>{displayRank}.</div>
            <div className={styles.avatar} style={member.profileImage ? { padding: 0, overflow: 'hidden', background: 'none' } : {}}>
                {member.profileImage ? (
                    <img src={member.profileImage} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    getInitials(member.name)
                )}
            </div>

            <div className={styles.nameCell}>
                <span className={styles.playerName}>
                    {member.nationality && <span style={{ marginRight: '6px', fontSize: '1.4rem', verticalAlign: 'middle' }}>{member.nationality}</span>}
                    {member.name}
                </span>

                {member.handedness && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        ({member.handedness === 'RIGHT' ? 'R' : member.handedness === 'LEFT' ? 'L' : 'A'})
                    </span>
                )}

                {/* Status Indicator Badge */}
                {showArrows && (
                    <span className={`${styles.badge} ${styles['status' + member.status]}`}>
                        {member.status === 'UP' && '↑'}
                        {member.status === 'DOWN' && '↓'}
                        {member.status === 'STAY' && '-'}
                    </span>
                )}

                {/* Sub Info Display (Read Only) */}
                {subNeeded && editMode !== 'SUB' && (
                    <span className={styles.subNeeded}>
                        {subName ? `Sub: ${subName}` : 'Sub needed'}
                    </span>
                )}
                {noShow && editMode !== 'SUB' && editMode !== 'SCORE' && (
                    <span className={styles.subNeeded}>
                        No Show
                    </span>
                )}

                {/* Edit Controls */}
                {editMode === 'SUB' && (
                    <div style={{ marginTop: '8px' }}>
                        {!subNeeded ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSubToggle(); }}
                                style={{ padding: '4px 10px', fontSize: '0.8rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}
                            >
                                + Add Sub
                            </button>
                        ) : (
                            <div className={styles.subInputGroup} style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Sub Details</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSubToggle(); }}
                                        style={{ padding: '2px 8px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Remove Sub
                                    </button>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <input
                                        list="sub-options"
                                        className={styles.subTextInput}
                                        placeholder="Name"
                                        value={subName}
                                        onChange={(e) => setSubName(e.target.value)}
                                        onBlur={handleSubInfoBlur}
                                        onClick={e => e.stopPropagation()}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <datalist id="sub-options">
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.name} />
                                        ))}
                                    </datalist>
                                    <input
                                        className={styles.subTextInput}
                                        placeholder="Phone"
                                        value={subContact}
                                        onChange={(e) => setSubContact(e.target.value)}
                                        onBlur={handleSubInfoBlur}
                                        onClick={e => e.stopPropagation()}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {editMode === 'SCORE' && (
                    <div style={{ marginTop: '6px' }} onClick={e => e.stopPropagation()}>
                        <label className={styles.subLabel} style={{ marginLeft: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                checked={noShow}
                                onChange={handleNoShowToggle}
                                style={{ marginRight: '6px' }}
                            />
                            Mark as No Show
                        </label>
                    </div>
                )}
            </div>

            <div className={styles.scoreCell}>
                {editMode === 'SCORE' ? (
                    <select
                        className={styles.scoreInput}
                        value={gamesWon ?? ''}
                        onChange={handleScoreChange}
                        onClick={e => e.stopPropagation()}
                        disabled={noShow}
                    >
                        <option value="">-</option>
                        {scoreOptions.map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                ) : (
                    <span>
                        {noShow ? 'NS' : (gamesWon !== null ? gamesWon : '-')}
                    </span>
                )}
            </div>
        </div>
    )
}
