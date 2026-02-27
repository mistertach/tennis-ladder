import Link from 'next/link';
import Gallery from './components/Gallery';
import styles from './page.module.css';
import prisma from '@/lib/prisma';

export default async function Home() {
    // Fetch currently active leagues to display on the public page
    const activeLeagues = await prisma.league.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, startDate: true }
    });

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <h1 className={styles.title}>Dhahran Tennis Association</h1>
                <p className={styles.subtitle}>
                    The Dhahran Tennis Association (DTA) is a vibrant community dedicated to promoting the sport of tennis within Dhahran, Saudi Arabia. Players of all skill levels are welcome.
                </p>
                <div className={styles.actions}>
                    <a href="https://forms.gle/UzEvsR4XFMRBSuxJ9" target="_blank" rel="noopener noreferrer" className={styles.button}>
                        2026 Membership Form
                    </a>
                    <Link href="#schedule" className={styles.secondaryButton}>
                        View Schedule
                    </Link>
                </div>
            </header>

            <main className={styles.contentWrapper}>
                <div className={styles.contentGrid}>

                    {/* Left Column: Community Info */}
                    <div className={styles.mainContent}>

                        <div className={styles.infoCard} style={{ background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', borderColor: 'var(--primary-color)' }}>
                            <h2 className={styles.sectionTitle} style={{ fontSize: '1.75rem' }}>🟢 Active Leagues</h2>

                            {activeLeagues.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {activeLeagues.map(league => (
                                        <Link key={league.id} href={`/league/${league.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className={styles.leagueItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-color, #ffffff)', marginBottom: 0 }}>
                                                <div className={styles.leagueName} style={{ marginBottom: 0 }}>
                                                    <span style={{ fontSize: '1.25rem' }}>{league.title}</span>
                                                    <span className={styles.statusIndicator} title="Active" style={{ marginLeft: '10px' }} />
                                                </div>
                                                <div className={styles.leagueMeta}>
                                                    Started {new Date(league.startDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--secondary-color)', fontStyle: 'italic' }}>There are currently no active leagues. Check back soon for the next season!</p>
                            )}
                        </div>

                        <div id="schedule" className={styles.infoCard}>
                            <h2 className={styles.sectionTitle}>📅 2026 Schedule</h2>
                            <p style={{ marginBottom: '1rem', fontStyle: 'italic', color: 'var(--secondary-color)' }}>
                                Please note that events and dates are subject to change.
                            </p>
                            <ul className={styles.scheduleList}>
                                <li>
                                    <span className={styles.badge}>Jan 18 – May 24</span>
                                    <span><strong>Spring Leagues</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Feb 2 – Mar 19</span>
                                    <span><strong>ASC 2nd Qualification Phase</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Feb 17 – Mar 18</span>
                                    <span><strong>Ramadan Mini-leagues</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Mar 29</span>
                                    <span><strong>Regular season matches resume</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Apr 10 – Apr 25</span>
                                    <span><strong>Aramco Sport Championship (ASC) Finals</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Apr 26 – May 2</span>
                                    <span><strong>Camel Cup</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>May 16</span>
                                    <span><strong>End-of-season social</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Aug 30</span>
                                    <span><strong>Fall league signups</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Sep 6 – Nov 29</span>
                                    <span><strong>Fall leagues</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Nov 5 – Nov 13</span>
                                    <span><strong>World Firefighter Games in Dhahran</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Nov 30 – Dec 5</span>
                                    <span><strong>Club Championship</strong></span>
                                </li>
                                <li>
                                    <span className={styles.badge}>Dec 12</span>
                                    <span><strong>End-of-season social & AGM</strong></span>
                                </li>
                            </ul>
                        </div>

                        <div className={styles.infoCard}>
                            <h2 className={styles.sectionTitle}>🎾 League Play & Rules</h2>
                            <ul className={styles.rulesList}>
                                <li><strong>Playing Times:</strong> Mixed doubles play Mondays at 5 p.m. Mixed singles play Sunday, Tuesday, and Wednesday at 5 p.m. or 7 p.m. Singles/doubles leagues for dependents meet Sunday/Wednesday at 8:30 a.m.</li>
                                <li><strong>Punctuality:</strong> Players must show up on time; warm-ups should be kept to 10 minutes so play can begin promptly.</li>
                                <li><strong>Equipment:</strong> One can of balls is provided per court (unless joining mid-season).</li>
                                <li><strong>Substitutes:</strong> You may serve as a sub anytime for free! Subs are needed weekly on a first-come, first-served basis in the WhatsApp chat. Check the court level to ensure it fits your skill.</li>
                                <li><strong>No-Shows & Penalties:</strong> Please be aware there are penalties for showing up late or not showing up. No-show players and subs can be removed from the league after two offenses. A no-show results in moving down a group, and a 6-game reduction.</li>
                                <li><strong>Court Access:</strong> Aramcons (and dependents, retirees, JHAH employees with camp access) can play free from 5 a.m. to 10 p.m. Reserve courts 1, 6, 14 at the <a href="https://maps.apple.com/?ll=26.311753,50.134706" target="_blank" style={{ textDecoration: 'underline', color: 'var(--primary-color)' }}>Hills</a> and 10, 11 at <a href="https://maps.apple.com/?ll=26.318353,50.141977" target="_blank" style={{ textDecoration: 'underline', color: 'var(--primary-color)' }}>3rd street</a> via the <a href="https://mycommunity.aramco.com" target="_blank" style={{ textDecoration: 'underline', color: 'var(--primary-color)' }}>myCommunity app</a>.</li>
                            </ul>
                        </div>

                        <div className={styles.infoCard}>
                            <h2 className={styles.sectionTitle}>👥 2025 DTA Board Members</h2>
                            <div className={styles.boardGrid}>
                                <div className={styles.boardMember}><div className={styles.boardRole}>President</div><div className={styles.boardName}>Daniel</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>VP</div><div className={styles.boardName}>Zara</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Secretary</div><div className={styles.boardName}>Robert</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Treasurer</div><div className={styles.boardName}>John</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Membership</div><div className={styles.boardName}>Amy</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Mx Doubles</div><div className={styles.boardName}>Vadzim</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Mx Singles</div><div className={styles.boardName}>Omar T</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Women's Doubles</div><div className={styles.boardName}>Britta / Jamie</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Women's Singles</div><div className={styles.boardName}>Sandi</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Tournament</div><div className={styles.boardName}>Mary / Thuy</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Social</div><div className={styles.boardName}>Samira</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Facilities</div><div className={styles.boardName}>Susan</div></div>
                                <div className={styles.boardMember}><div className={styles.boardRole}>Coaching</div><div className={styles.boardName}>Steve</div></div>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h2 className={styles.sectionTitle}>📸 DTA Gallery</h2>
                            <p style={{ marginBottom: '1rem', fontStyle: 'italic', color: 'var(--secondary-color)' }}>
                                Snapshots from our recent tournaments and social events! Click any photo to enlarge.
                            </p>
                            <Gallery />
                        </div>

                    </div>

                    {/* Right Column: Sidebar */}
                    <div>
                        <div className={styles.infoCard}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: '1.4rem' }}>💳 Fees & Registration</h3>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Membership expires at the end of the year and is renewed in January. Dues are deducted from payroll.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                <strong>Individual DTA Membership</strong>
                                <span>100 SAR</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                <strong>Family DTA Membership</strong>
                                <span>150 SAR</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>League Fee (per season)</strong>
                                <span>200 SAR</span>
                            </div>
                            <a href="https://forms.gle/UzEvsR4XFMRBSuxJ9" target="_blank" rel="noopener noreferrer" className={styles.secondaryButton} style={{ width: '100%', display: 'block', textAlign: 'center', marginTop: '1.5rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
                                2026 Membership Form
                            </a>
                        </div>

                        <div className={styles.infoCard}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: '1.4rem' }}>💬 Community & Coaching</h3>
                            <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Members gain access to a managed WhatsApp community featuring:</p>
                            <ul className={styles.rulesList} style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                <li><strong>League-Specific Groups</strong> for score reporting and subs.</li>
                                <li><strong>Q&A</strong> with the Board.</li>
                            </ul>

                            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Professional Coaching</h4>
                            <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>We are excited to partner with Coach Hassan for the 2026 season! Join the WhatsApp chat to sign up for an 8-week structured program for adults and juniors.</p>

                            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    <span>Program Structure (8 Weeks)</span>
                                    <span>Price per Player</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span>Private (1 on 1)</span>
                                    <span>2,400 SAR</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span>Semi-Private (2 players)</span>
                                    <span>1,600 SAR</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span>Group (3 players)</span>
                                    <span>1,120 SAR</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Group (4 players)</span>
                                    <span>960 SAR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
