'use client'

import { useState } from 'react'
import { createCoach, updateCoach, deleteCoach } from './actions'
import styles from './CoachesClient.module.css'

export default function CoachesClient({ initialCoaches }) {
    const [coaches, setCoaches] = useState(initialCoaches || [])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCoach, setEditingCoach] = useState(null)
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', bio: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleOpenModal = (coach = null) => {
        setError(null)
        if (coach) {
            setEditingCoach(coach)
            setFormData({
                name: coach.name || '',
                email: coach.email || '',
                phone: coach.phone || '',
                bio: coach.bio || ''
            })
        } else {
            setEditingCoach(null)
            setFormData({ name: '', email: '', phone: '', bio: '' })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingCoach(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            if (editingCoach) {
                const res = await updateCoach(editingCoach.id, formData)
                if (res.success) {
                    setCoaches(coaches.map(c => c.id === editingCoach.id ? res.coach : c))
                    handleCloseModal()
                } else {
                    setError(res.error)
                }
            } else {
                const res = await createCoach(formData)
                if (res.success) {
                    setCoaches([...coaches, res.coach])
                    handleCloseModal()
                } else {
                    setError(res.error)
                }
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this coach?")) return

        try {
            const res = await deleteCoach(id)
            if (res.success) {
                setCoaches(coaches.filter(c => c.id !== id))
            } else {
                alert(res.error) // Simple alert for delete errors like "has sessions"
            }
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div>
            <button className={styles.addButton} onClick={() => handleOpenModal()}>
                + Add New Coach
            </button>

            <div className={styles.container}>
                <div className={styles.tableHeader}>
                    <div>Name</div>
                    <div>Email</div>
                    <div>Phone</div>
                    <div>Bio</div>
                    <div className={styles.actionCell}>Actions</div>
                </div>

                {coaches.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No coaches added yet.
                    </div>
                ) : (
                    coaches.map(coach => (
                        <div key={coach.id} className={styles.tableRow}>
                            <div style={{ fontWeight: '500' }}>{coach.name}</div>
                            <div>{coach.email || '-'}</div>
                            <div>{coach.phone || '-'}</div>
                            <div style={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {coach.bio || '-'}
                            </div>
                            <div className={styles.actionCell}>
                                <button className={styles.editButton} onClick={() => handleOpenModal(coach)}>Edit</button>
                                <button className={styles.deleteButton} onClick={() => handleDelete(coach.id)}>Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</h2>
                            <button className={styles.closeButton} onClick={handleCloseModal}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Name *</label>
                                <input
                                    type="text"
                                    required
                                    className={styles.input}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Phone</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Bio / Description</label>
                                <textarea
                                    className={styles.textarea}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Brief bio or description of the coach..."
                                />
                            </div>

                            {error && <div className={styles.errorText}>{error}</div>}

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelButton} onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveButton} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Coach'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
