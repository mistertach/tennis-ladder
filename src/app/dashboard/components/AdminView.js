'use client'

import Link from 'next/link'
import styles from '../page.module.css'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#E056FD', '#F9CA24'];

const getCountryName = (emoji) => {
    if (!emoji || emoji.length < 2) return emoji;
    try {
        const code = [...emoji].map(c => String.fromCharCode(c.codePointAt(0) - 127397)).join('');
        return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || emoji;
    } catch (e) {
        return emoji;
    }
}

export default function AdminView({ user, leagues, stats, analytics }) {
    // leagues and users are passed as props now
    const router = useRouter()
    const [deletingId, setDeletingId] = useState(null)
    const [showCharts, setShowCharts] = useState(false)

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this league? This cannot be undone.')) return

        setDeletingId(id)
        try {
            const res = await fetch(`/api/league/${id}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete')

            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Error deleting league')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div>
            {stats && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.totalPlayers}</div>
                        <div className={styles.statLabel}>Total Players</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.totalBoardMembers}</div>
                        <div className={styles.statLabel}>DTA Board Members</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.totalActiveLeagues}</div>
                        <div className={styles.statLabel}>Active Leagues</div>
                    </div>
                </div>
            )}

            <div className={styles.sectionHeader}>
                <h2 className={styles.title}>Leagues Management</h2>
                <Link href="/admin/league/new" className={styles.actionButton}>
                    + Create New League
                </Link>
            </div>

            <div className={styles.section}>
                {leagues.length === 0 ? (
                    <div className={styles.emptyState}>No leagues created yet.</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Starts</th>
                                    <th>Weeks</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leagues.map(league => (
                                    <tr key={league.id}>
                                        <td>{league.title}</td>
                                        <td>{league.status}</td>
                                        <td>{new Date(league.startDate).toLocaleDateString()}</td>
                                        <td>{league.durationWeeks}</td>
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link href={`/admin/league/${league.id}`} className={styles.actionButton} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#3b82f6' }}>
                                                Manage
                                            </Link>
                                            <Link href={`/league/${league.id}`} className={styles.actionButton} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                                                Public View
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(league.id)}
                                                className={styles.deleteButton}
                                                disabled={deletingId === league.id}
                                                style={{
                                                    background: '#fee2e2',
                                                    color: '#ef4444',
                                                    border: '1px solid #fecaca',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {deletingId === league.id ? '...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className={styles.sectionHeader} style={{ marginTop: '2rem' }}>
                <h2 className={styles.title}>League Analytics</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className={styles.actionButton}
                        style={{ background: '#34495e' }}
                        onClick={() => setShowCharts(!showCharts)}
                    >
                        {showCharts ? 'View as List' : 'View as Charts'}
                    </button>
                    <Link href="/admin/players" className={styles.actionButton} style={{ background: '#27ae60' }}>
                        Manage All Players
                    </Link>
                    <Link href="/admin/coaches" className={styles.actionButton} style={{ background: '#8e44ad' }}>
                        Manage Coaches
                    </Link>
                    <Link href="/admin/coaching" className={styles.actionButton} style={{ background: '#9b59b6' }}>
                        Coaching Schedule
                    </Link>
                </div>
            </div>
            {analytics && (
                <div className={styles.analyticsGrid}>
                    <div className={styles.analyticsCard}>
                        <h3>Most Active Players</h3>
                        {showCharts && analytics.topActive.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analytics.topActive} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="appearances" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ul className={styles.analyticsList}>
                                {analytics.topActive.map((player) => (
                                    <li key={player.id} className={styles.analyticsItem}>
                                        <span>{player.name}</span>
                                        <strong>{player.appearances} appearances</strong>
                                    </li>
                                ))}
                                {analytics.topActive.length === 0 && <li className={styles.analyticsItem}>No appearances yet.</li>}
                            </ul>
                        )}
                    </div>

                    <div className={styles.analyticsCard}>
                        <h3>Top Sub Requesters</h3>
                        {showCharts && analytics.topSubs.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analytics.topSubs} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#e74c3c" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ul className={styles.analyticsList}>
                                {analytics.topSubs.map((sub, i) => (
                                    <li key={i} className={styles.analyticsItem}>
                                        <span>{sub.name}</span>
                                        <strong>{sub.count} subs</strong>
                                    </li>
                                ))}
                                {analytics.topSubs.length === 0 && <li className={styles.analyticsItem}>No subs required yet.</li>}
                            </ul>
                        )}
                    </div>

                    <div className={styles.analyticsCard}>
                        <h3>Handedness Breakdown</h3>
                        {showCharts && analytics.handedness.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={analytics.handedness} dataKey="_count._all" nameKey="handedness" cx="50%" cy="50%" outerRadius={80} label>
                                        {analytics.handedness.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name.toLowerCase()]} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <ul className={styles.analyticsList}>
                                {analytics.handedness.map((hand, i) => (
                                    <li key={i} className={styles.analyticsItem}>
                                        <span style={{ textTransform: 'capitalize' }}>{hand.handedness.toLowerCase()}</span>
                                        <strong>{hand._count._all} players</strong>
                                    </li>
                                ))}
                                {analytics.handedness.length === 0 && <li className={styles.analyticsItem}>No data.</li>}
                            </ul>
                        )}
                    </div>

                    <div className={styles.analyticsCard}>
                        <h3>Gender Breakdown</h3>
                        {showCharts && analytics.genders.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={analytics.genders} dataKey="_count._all" nameKey="gender" cx="50%" cy="50%" outerRadius={80} label>
                                        {analytics.genders.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#e84393', '#0984e3', '#636e72'][index % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name.toLowerCase()]} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <ul className={styles.analyticsList}>
                                {analytics.genders.map((gen, i) => (
                                    <li key={i} className={styles.analyticsItem}>
                                        <span style={{ textTransform: 'capitalize' }}>{gen.gender.toLowerCase()}</span>
                                        <strong>{gen._count._all} players</strong>
                                    </li>
                                ))}
                                {analytics.genders.length === 0 && <li className={styles.analyticsItem}>No data.</li>}
                            </ul>
                        )}
                    </div>

                    <div className={styles.analyticsCard}>
                        <h3>Nationality Diversity</h3>
                        {showCharts && analytics.nationalities.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analytics.nationalities} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                    <XAxis dataKey="nationality" tick={{ fontSize: 20 }} />
                                    <YAxis />
                                    <Tooltip formatter={(value, name, props) => [value, getCountryName(props.payload.nationality)]} />
                                    <Bar dataKey="_count._all" fill="#f1c40f" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ul className={styles.analyticsList}>
                                {analytics.nationalities.map((nat, i) => (
                                    <li key={i} className={styles.analyticsItem}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{nat.nationality}</span>
                                            <span>{getCountryName(nat.nationality)}</span>
                                        </span>
                                        <strong>{nat._count._all} players</strong>
                                    </li>
                                ))}
                                {analytics.nationalities.length === 0 && <li className={styles.analyticsItem}>No data.</li>}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
