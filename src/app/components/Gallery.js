'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from '../page.module.css'

export default function Gallery() {
    const [selectedImage, setSelectedImage] = useState(null)
    const images = [1, 2, 3, 4, 5].map(num => `/images/gallery/gallery-0${num}.jpg`)

    return (
        <>
            <div className={styles.galleryGrid}>
                {images.map((src, index) => (
                    <div
                        key={index}
                        className={styles.galleryItem}
                        onClick={() => setSelectedImage(src)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Image
                            src={src}
                            alt={`DTA Tennis Event ${index + 1}`}
                            fill
                            className={styles.galleryImage}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                ))}
            </div>

            {selectedImage && (
                <div className={styles.lightbox} onClick={() => setSelectedImage(null)}>
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.lightboxClose}
                            onClick={() => setSelectedImage(null)}
                            title="Close"
                        >&times;</button>
                        <Image
                            src={selectedImage}
                            alt="Expanded gallery image"
                            fill
                            className={styles.lightboxImage}
                            sizes="100vw"
                        />
                    </div>
                </div>
            )}
        </>
    )
}
