'use client'

import { useState, useEffect } from 'react'
import { getSessionsForWeek } from './actions'
import styles from './WeeklyCalendar.module.css'

// Helper to get Sunday of a given date's week
function getSunday(d) {
    const nd = new Date(d)
    const day = nd.getDay()
    nd.setDate(nd.getDate() - day)
    nd.setHours(0, 0, 0, 0)
    return nd
}

// Helper to reliably format YYYY-MM-DD in local time
function getLocalDateString(d) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8 to 20 (8am to 8pm)
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

export default function WeeklyCalendar({ initialSessions, initialStartDate, onSlotClick }) {
    const [currentDate, setCurrentDate] = useState(new Date(initialStartDate))
    const [sessions, setSessions] = useState(initialSessions)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Skip fetch on mount if it's the initial date, but we do need to handle changes
        const fetchSessions = async () => {
            setIsLoading(true)
            const sunday = getSunday(currentDate)
            const thursday = new Date(sunday)
            thursday.setDate(thursday.getDate() + 5) // End of Thursday night
            thursday.setHours(23, 59, 59, 999)

            try {
                const data = await getSessionsForWeek(sunday.toISOString(), thursday.toISOString())
                setSessions(data)
            } catch (error) {
                console.error("Failed to fetch sessions", error)
            } finally {
                setIsLoading(false)
            }
        }

        // Don't refetch on first mount because we use initialSessions
        if (getSunday(currentDate).getTime() !== getSunday(initialStartDate).getTime()) {
            fetchSessions()
        }
    }, [currentDate, initialStartDate])

    const handlePreviousWeek = () => {
        const next = new Date(currentDate)
        next.setDate(next.getDate() - 7)
        setCurrentDate(next)
    }

    const handleNextWeek = () => {
        const next = new Date(currentDate)
        next.setDate(next.getDate() + 7)
        setCurrentDate(next)
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const getWeekStr = () => {
        const sun = getSunday(currentDate)
        const thu = new Date(sun)
        thu.setDate(thu.getDate() + 4)

        const options = { month: 'short', day: 'numeric' }
        return `${sun.toLocaleDateString(undefined, options)} - ${thu.toLocaleDateString(undefined, options)}, ${thu.getFullYear()}`
    }

    // Organize sessions into a map: "DayIndex-Hour" -> [sessions]
    // DayIndex: 0=Sun, 1=Mon, ..., 4=Thu
    const sessionMap = {}
    sessions.forEach(session => {
        const date = new Date(session.date)

        // Ensure session belongs to the currently viewed week
        if (getSunday(date).getTime() !== getSunday(currentDate).getTime()) return

        const dayIdx = date.getDay()
        if (dayIdx > 4) return // Skip Friday (5) and Saturday (6)

        const hour = date.getHours()
        const key = `${dayIdx}-${hour}`
        if (!sessionMap[key]) sessionMap[key] = []
        sessionMap[key].push(session)
    })

    return (
        <div className={styles.calendarContainer}>
            <div className={styles.calendarHeader}>
                <button className={styles.navButton} onClick={handlePreviousWeek}>&larr; Previous</button>
                <div style={{ textAlign: 'center' }}>
                    <div className={styles.currentWeek}>{getWeekStr()}</div>
                    <button onClick={handleToday} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Go to current week
                    </button>
                </div>
                <button className={styles.navButton} onClick={handleNextWeek}>Next &rarr;</button>
            </div>

            {isLoading ? (
                <div className={styles.loading}>Loading schedule...</div>
            ) : (
                <div className={styles.grid}>
                    {/* Header Row */}
                    <div className={`${styles.cell} ${styles.headerCell}`}>Time</div>
                    {DAYS.map((day, i) => {
                        const date = new Date(getSunday(currentDate))
                        date.setDate(date.getDate() + i)
                        return (
                            <div key={day} className={`${styles.cell} ${styles.headerCell}`}>
                                {day}
                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal', marginTop: '0.25rem' }}>
                                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        )
                    })}

                    {/* Time Rows */}
                    {HOURS.map(hour => {
                        const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`
                        return (
                            <div style={{ display: 'contents' }} key={`row-${hour}`}>
                                <div className={`${styles.cell} ${styles.timeCell}`}>{displayHour}</div>

                                {DAYS.map((_, dayIdx) => {
                                    const key = `${dayIdx}-${hour}`
                                    const slotSessions = sessionMap[key] || []

                                    return (
                                        <div key={key} className={styles.cell}>
                                            {slotSessions.length > 0 ? (
                                                <>
                                                    {slotSessions.map(session => (
                                                        <div
                                                            key={session.id}
                                                            className={`${styles.sessionCard} ${session.students.length >= 4 ? styles.full : ''}`}
                                                        >
                                                            <div className={styles.sessionTime}>
                                                                {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                {session.durationMin !== 60 && ` (${session.durationMin}m)`}
                                                            </div>
                                                            <div className={styles.coachName}>Coach {session.coach.name}</div>
                                                            <div className={styles.studentsList}>
                                                                {session.students.map(st => st.user.name.split(' ')[0]).join(', ')}
                                                                {session.students.length === 0 && 'No students'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {onSlotClick && (
                                                        <button
                                                            className={styles.addSessionBtn}
                                                            onClick={() => {
                                                                const slotDate = new Date(getSunday(currentDate))
                                                                slotDate.setDate(slotDate.getDate() + dayIdx)
                                                                const dateStr = getLocalDateString(slotDate)
                                                                const timeStr = `${hour.toString().padStart(2, '0')}:00`
                                                                onSlotClick(dateStr, timeStr)
                                                            }}
                                                        >
                                                            + Add
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div
                                                    className={`${styles.emptySlot} ${onSlotClick ? styles.clickableSlot : ''}`}
                                                    onClick={() => {
                                                        if (onSlotClick) {
                                                            const slotDate = new Date(getSunday(currentDate))
                                                            slotDate.setDate(slotDate.getDate() + dayIdx)
                                                            const dateStr = getLocalDateString(slotDate)
                                                            const timeStr = `${hour.toString().padStart(2, '0')}:00`
                                                            onSlotClick(dateStr, timeStr)
                                                        }
                                                    }}
                                                >
                                                    {onSlotClick ? '+ Schedule' : 'Empty slot'}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
