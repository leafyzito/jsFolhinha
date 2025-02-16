function calculateXPRange(level) {
    // XP gain formula: 50~75 + 3 * level
    const minXP = 50 + 3 * level;
    const maxXP = 75 + 3 * level;

    // XP needed for next level formula: 100 * level + 25 * (level * (level + 1) / 2)
    const xpNeededForNextLevel = 100 * level + 25 * (level * (level + 1) / 2);

    return {
        level,
        xpRange: `${Math.round(minXP)}-${Math.round(maxXP)}`,
        xpNeededForNextLevel: Math.round(xpNeededForNextLevel),
        minDungeonsNeeded: Math.ceil(xpNeededForNextLevel / maxXP),
        maxDungeonsNeeded: Math.ceil(xpNeededForNextLevel / minXP)
    };
}

function generateXPTable(maxLevel = 10) {
    console.log('Level | XP Gain Range | XP Needed for Next Level | Dungeons Needed (Min-Max)');
    console.log('------|--------------|----------------------|------------------------');

    for (let level = 0; level <= maxLevel; level++) {
        const stats = calculateXPRange(level);
        console.log(
            `${stats.level.toString().padEnd(5)} | ` +
            `${stats.xpRange.padEnd(12)} | ` +
            `${stats.xpNeededForNextLevel.toString().padEnd(20)} | ` +
            `${stats.minDungeonsNeeded}-${stats.maxDungeonsNeeded}`
        );
    }
}

// Generate table for first 200 levels
generateXPTable(200); 