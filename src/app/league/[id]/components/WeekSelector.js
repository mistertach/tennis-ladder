'use client'

import { useRouter } from 'next/navigation'
import styles from './WeekSelector.module.css'

export default function WeekSelector({ currentWeek, totalWeeks, baseUrl, dateStr }) {
    const router = useRouter()

    const handleChange = (e) => {
        const week = e.target.value
        router.push(`${baseUrl}?week=${week}`)
    }

    return (
        <div className={styles.container}>
            <select
                value={currentWeek}
                onChange={handleChange}
                className={styles.select}
            >
                {Array.from({ length: totalWeeks || 8 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                        Week {i + 1}
                    </option>
                ))}
            </select>
            <div className={styles.date}>{dateStr}</div>
        </div>
    )
}
