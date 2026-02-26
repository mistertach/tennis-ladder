'use client'

import { useState } from 'react'
import { updateWeeklyScore, toggleSubNeeded, updateSubDetails, updateNoShow } from '../actions'
import styles from './GroupCard.module.css'
import { calculateGroupStandings } from '@/lib/ranking'

export default function GroupCard({ group, week, scores, totalTiers, gamesPerMatch = 7, startingRank = 0, allUsers = [] }) {
    const [isEditing, setIsEditing] = useState(false)
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
        <div className={styles.group}>
            <div className={styles.groupHead}>
                Group {group.tier}
                {showWarning && (
                    <span style={{ fontSize: '0.6em', color: 'orange', marginLeft: '10px' }} title={`Total games should be ${expectedTotal}`}>
                        ⚠️ Check Totals ({totalGamesRecorded}/{expectedTotal})
                    </span>
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
                            isEditing={isEditing}
                            onUpdate={handleScoreUpdate}
                            showArrows={isGroupComplete}
                            maxPossibleScore={maxPossibleScore}
                            displayRank={startingRank + member.rank}
                            allUsers={allUsers}
                        />
                    )
                })}
            </div>

            <button
                className={styles.reportButton}
                onClick={() => setIsEditing(!isEditing)}
            >
                {isEditing ? 'Done' : 'Edit'}
            </button>
        </div>
    )
}

function PlayerRow({ member, score, week, groupId, isEditing, onUpdate, showArrows, maxPossibleScore, displayRank, allUsers }) {
    const subNeeded = score?.subNeeded || false
    // Default to null if undefined, so we can detect "not played"
    const gamesWon = score?.gamesWon ?? null
    const noShow = score?.noShow || false

    // Sub Details State
    const [subName, setSubName] = useState(score?.subName || '')
    const [subContact, setSubContact] = useState(score?.subContact || '')

    const handleSubToggle = async () => {
        if (!isEditing) return
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
        if (!isEditing) return
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
                {subNeeded && !isEditing && (
                    <span className={styles.subNeeded}>
                        {subName ? `Sub: ${subName}` : 'Sub needed'}
                    </span>
                )}
                {noShow && !isEditing && (
                    <span className={styles.subNeeded}>
                        No Show
                    </span>
                )}

                {/* Edit Controls */}
                {isEditing && (
                    <div style={{ marginTop: '4px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <label className={styles.subLabel} style={{ marginLeft: 0, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={subNeeded}
                                    onChange={handleSubToggle}
                                    style={{ marginRight: '4px' }}
                                />
                                Sub needed
                            </label>

                            <label className={styles.subLabel} style={{ marginLeft: 0, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={noShow}
                                    onChange={handleNoShowToggle}
                                    style={{ marginRight: '4px' }}
                                />
                                No Show
                            </label>
                        </div>

                        {subNeeded && (
                            <div className={styles.subInputGroup}>
                                <div style={{ flex: 1 }}>
                                    <input
                                        list="sub-options"
                                        className={styles.subTextInput}
                                        placeholder="Name"
                                        value={subName}
                                        onChange={(e) => setSubName(e.target.value)}
                                        onBlur={handleSubInfoBlur}
                                        style={{ width: '100%' }}
                                    />
                                    <datalist id="sub-options">
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.name} />
                                        ))}
                                    </datalist>
                                </div>
                                <input
                                    className={styles.subTextInput}
                                    placeholder="Phone"
                                    value={subContact}
                                    onChange={(e) => setSubContact(e.target.value)}
                                    onBlur={handleSubInfoBlur}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.scoreCell}>
                {isEditing ? (
                    <select
                        className={styles.scoreInput}
                        value={gamesWon ?? ''}
                        onChange={handleScoreChange}
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
