export function calculateGroupStandings(members, scores, matches, tier, totalTiers) {
    // 1. Merge members with their scores and preserve original order (Seeding)
    const data = members.map((m, originalIndex) => {
        const score = scores.find(s => s.userId === m.userId)
        return {
            ...m,
            gamesWon: score?.gamesWon || 0,
            subNeeded: score?.subNeeded || false,
            userId: m.userId,
            name: m.user.name,
            nationality: m.user.nationality, // Map fields from user relation
            handedness: m.user.handedness,  // Map fields from user relation
            originalRank: m.rank || (originalIndex + 1) // Use explicit rank from DB if available, else fallback to index
        }
    })

    // 2. Calculate Performance Standing
    // Sort by Games Won (Desc), then Head-to-Head (Winner > Loser), then Original Rank (Asc)
    const performanceList = [...data].sort((a, b) => {
        // Priority 1: Games Won
        if (b.gamesWon !== a.gamesWon) {
            return b.gamesWon - a.gamesWon
        }

        // Priority 2: Head-to-Head
        // Find match between A and B
        const match = matches.find(m =>
            (m.player1Id === a.userId && m.player2Id === b.userId) ||
            (m.player1Id === b.userId && m.player2Id === a.userId)
        )

        if (match) {
            // Check who won
            // If A was Player 1
            if (match.player1Id === a.userId) {
                if (match.scorePlayer1 > match.scorePlayer2) return -1 // A wins -> A comes first
                if (match.scorePlayer2 > match.scorePlayer1) return 1  // B wins -> B comes first
            } else {
                // A was Player 2
                if (match.scorePlayer2 > match.scorePlayer1) return -1 // A wins -> A comes first
                if (match.scorePlayer1 > match.scorePlayer2) return 1  // B wins -> B comes first
            }
        }

        // Priority 3: Original Rank (Lower is better/higher seed)
        return a.originalRank - b.originalRank
    })

    const isTopGroup = tier === 1
    const isBottomGroup = tier === totalTiers

    // 3. Assign Movement Status based on performance position
    // Standard Rules derived from user requests:
    // - Default: 1 UP, 1 DOWN
    // - Tier 1: 0 UP, 2 DOWN
    // - Tier 2: 2 UP, 1 DOWN
    // - 2nd Last: 1 UP (Normally) -> But user requested "two going down" for 2nd last group specifically.
    // - Last: 2 UP, 0 DOWN

    let upCount = 1
    let downCount = 1

    if (isTopGroup) {
        upCount = 0
        downCount = 2
    } else if (isBottomGroup) {
        upCount = 2
        downCount = 0
    } else {
        // Middle Tiers
        if (tier === 2) upCount = 2
        if (tier === totalTiers - 1) downCount = 2
    }

    performanceList.forEach((player, index) => {
        let status = 'STAY'

        if (index < upCount) {
            status = 'UP'
        } else if (index >= performanceList.length - downCount) {
            status = 'DOWN'
        }

        // Apply Sub Rule: Subs cannot go UP
        if (player.subNeeded && status === 'UP') {
            status = 'STAY'
        }

        player.status = status
    })

    // 4. Return list in ORIGINAL order (Fixed Display)
    // The 'status' field now reflects their calculated performance outcome.
    return data.map(p => {
        const perfSearch = performanceList.find(x => x.userId === p.userId)
        return { ...p, status: perfSearch.status, rank: p.originalRank }
    })
}
