'use client'

import { useEffect, useState } from 'react'
import { triggerAutoGeneration } from '../adminActions'
import { useRouter } from 'next/navigation'

export default function AutoGenerateCheck({ leagueId, week }) {
    const [status, setStatus] = useState('Checking for auto-generation...')
    const router = useRouter()

    useEffect(() => {
        const check = async () => {
            try {
                const res = await triggerAutoGeneration(leagueId, week)
                if (res.success) {
                    setStatus('Schedule generated! Refreshing...')
                    router.refresh()
                } else {
                    setStatus('Waiting for previous week to complete...')
                }
            } catch (e) {
                console.error(e)
                setStatus('Error checking generation.')
            }
        }
        check()
    }, [leagueId, week, router])

    return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {status}
        </div>
    )
}
