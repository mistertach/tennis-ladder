'use client'

import { useState } from 'react'
import { createSession, deleteSession } from './actions'
import styles from './CoachingClient.module.css'
import WeeklyCalendar from '@/app/coaching/WeeklyCalendar'

export default function CoachingClient({ coaches, players, initialSessions }) {
    const [sessions, setSessions] = useState(initialSessions || [])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [selectedCoachFilter, setSelectedCoachFilter] = useState('')

    const [formData, setFormData] = useState({
        coachId: '',
        date: '',
        time: '17:00',
        durationMin: 60,
        price: '',
        studentIds: [],
        isRecurring: false,
        recurringWeeks: 4
    })

    const handleOpenModal = () => {
        setError(null)
        setFormData({
            coachId: coaches[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
            time: '17:00',
            durationMin: 60,
            price: '',
            studentIds: [],
            isRecurring: false,
            recurringWeeks: 4
        })
        setIsModalOpen(true)
    }

    const handleSlotClick = (dateStr, timeStr) => {
        setError(null)
        setFormData({
            coachId: coaches[0]?.id || '',
            date: dateStr,
            time: timeStr,
            durationMin: 60,
            price: '',
            studentIds: [],
            isRecurring: false,
            recurringWeeks: 4
        })
        setIsModalOpen(true)
    }

    const handleStudentToggle = (id) => {
        setFormData(prev => {
            const current = [...prev.studentIds]
            let newStudents = []
            if (current.includes(id)) {
                newStudents = current.filter(s => s !== id)
            } else {
                if (current.length >= 4) return prev // Max 4 students
                newStudents = [...current, id]
            }

            const count = newStudents.length
            let calculatedPrice = ''
            if (count === 1) calculatedPrice = 250
            else if (count === 2) calculatedPrice = 300
            else if (count === 3) calculatedPrice = 340
            else if (count === 4) calculatedPrice = 400

            return { ...prev, studentIds: newStudents, price: calculatedPrice }
        })
    }



    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.studentIds.length === 0) {
            setError("You must select at least one student.")
            return
        }
        if (!formData.coachId) {
            setError("You must select a coach.")
            return
        }

        setIsLoading(true)
        setError(null)

        // Combine date and time
        const combinedDate = new Date(`${formData.date}T${formData.time}:00`)

        try {
            const res = await createSession({
                ...formData,
                date: combinedDate
            })

            if (res.success) {
                // To keep it simple, we just close and tell the user to refresh, or we can fetch again.
                // In a real app we'd fetch the newly created sessions and append.
                // For now, reloading the page is safest to get the new list with student joins.
                window.location.reload()
                // setIsModalOpen(false)
            } else {
                setError(res.error)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this session?")) return
        try {
            const res = await deleteSession(id)
            if (res.success) {
                setSessions(sessions.filter(s => s.id !== id))
            } else {
                alert(res.error)
            }
        } catch (err) {
            alert(err.message)
        }
    }

    const filteredSessions = selectedCoachFilter
        ? sessions.filter(s => s.coachId === selectedCoachFilter)
        : sessions

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 className={styles.title}>Upcoming schedule</h2>
                    <select
                        className={styles.select}
                        style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        value={selectedCoachFilter}
                        onChange={e => setSelectedCoachFilter(e.target.value)}
                    >
                        <option value="">All Coaches</option>
                        {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <button className={styles.addButton} onClick={handleOpenModal} disabled={coaches.length === 0}>
                    + Schedule Session
                </button>
            </div>

            {coaches.length === 0 && (
                <div style={{ padding: '1rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '6px', marginBottom: '1rem' }}>
                    You need to create a Coach first before scheduling sessions! Go to "Manage Coaches".
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <WeeklyCalendar
                    initialSessions={sessions}
                    initialStartDate={new Date().toISOString()}
                    onSlotClick={handleSlotClick}
                />
            </div>

            <div className={styles.headerRow} style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>List View (All Upcoming)</h3>
            </div>

            {filteredSessions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No upcoming sessions scheduled.
                </div>
            ) : (
                <div>
                    {filteredSessions.map(session => (
                        <div key={session.id} className={styles.sessionCard}>
                            <div className={styles.sessionInfo}>
                                <div className={styles.sessionTime}>
                                    {new Date(session.date).toLocaleDateString()} @ {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className={styles.sessionCoach}>Coach {session.coach.name} ({session.durationMin} mins)</div>
                                <div className={styles.sessionStudents}>
                                    {session.students.map(st => (
                                        <span key={st.user.id} className={styles.studentBadge}>
                                            {st.user.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div className={styles.sessionPrice}>{session.price} SAR</div>
                                <button className={styles.deleteButton} onClick={() => handleDelete(session.id)}>Cancel</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Schedule Session</h2>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        {error && <div className={styles.errorText}>{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroupFull}>
                                <label className={styles.label}>Coach *</label>
                                <select
                                    className={styles.select}
                                    value={formData.coachId}
                                    onChange={e => setFormData({ ...formData, coachId: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select a coach...</option>
                                    {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Date *</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Time *</label>
                                    <input
                                        type="time"
                                        className={styles.input}
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroupFull}>
                                <label className={styles.label}>Students (Max 4) *</label>
                                <div className={styles.multiSelectContainer}>
                                    {players.map(p => (
                                        <label key={p.id} className={styles.studentOption}>
                                            <input
                                                type="checkbox"
                                                checked={formData.studentIds.includes(p.id)}
                                                onChange={() => handleStudentToggle(p.id)}
                                                disabled={!formData.studentIds.includes(p.id) && formData.studentIds.length >= 4}
                                            />
                                            {p.name} <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({p.level})</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    {formData.studentIds.length}/4 selected
                                </div>
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Price (SAR) *</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="e.g. 300"
                                        required
                                    />
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        Auto-calculated: 250 (1), 300 (2), 340 (3), 400 (4). Edit to override.
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Duration (mins)</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={formData.durationMin}
                                        onChange={e => setFormData({ ...formData, durationMin: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroupFull} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecurring}
                                        onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                                    />
                                    Make this a recurring weekly session
                                </label>

                                {formData.isRecurring && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <label className={styles.label}>Number of Weeks</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={formData.recurringWeeks}
                                            onChange={e => setFormData({ ...formData, recurringWeeks: e.target.value })}
                                            min="2"
                                            max="24"
                                            style={{ width: '100px' }}
                                        />
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.5rem' }}>
                                            Will create {formData.recurringWeeks} identical sessions weekly.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveButton} disabled={isLoading}>
                                    {isLoading ? 'Scheduling...' : 'Schedule Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
