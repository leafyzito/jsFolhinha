class AFKInfo {
    constructor(alias, emoji, afk, isafk, returned, rafk) {
        this.alias = alias;
        this.emoji = emoji;
        this.afk = afk;
        this.isafk = isafk;
        this.returned = returned;
        this.rafk = rafk;
    }

    static fromJSON(json) {
        return new AFKInfo(json.alias, json.emoji, json.afk, json.isafk, json.returned, json.rafk);
    }
}

// Example usage:
const afkData = [
    {
        alias: ['afk'],
        emoji: '🏃⌨',
        afk: 'ficou afk',
        isafk: 'afk',
        returned: 'voltou',
        rafk: 'a ficar afk',
    },
    {
        alias: ['art', 'arte', 'desenhar'],
        emoji: '🎨',
        afk: 'foi desenhar',
        isafk: 'desenhando',
        returned: 'desenhou',
        rafk: 'desenhando',
    },
    {
        alias: ['brb'],
        emoji: '🏃⌨',
        afk: 'volta já',
        isafk: 'fora',
        returned: 'voltou',
        rafk: 'pra fora',
    },
    {
        alias: ['code', 'programar'],
        emoji: '💻',
        afk: 'foi programar',
        isafk: 'programando',
        returned: 'programou',
        rafk: 'programando',
    },
    {
        alias: ['food', 'comer'],
        emoji: '🍽',
        afk: 'foi comer',
        isafk: 'comendo',
        returned: 'comeu',
        rafk: 'comendo',
    },
    {
        alias: ['game', 'jogar'],
        emoji: '🎮',
        afk: 'foi jogar',
        isafk: 'jogando',
        returned: 'jogou',
        rafk: 'jogando',
    },
    {
        alias: ['gn', 'dormir', 'sleep'],
        emoji: '💤',
        afk: 'foi dormir',
        isafk: 'dormindo',
        returned: 'acordou',
        rafk: 'dormindo',
    },
    {
        alias: ['work', 'trabalhar'],
        emoji: '💼',
        afk: 'foi trabalhar',
        isafk: 'trabalhando',
        returned: 'trabalhou',
        rafk: 'trabalhando',
    },
    {
        alias: ['read', 'ler'],
        emoji: '📖',
        afk: 'foi ler',
        isafk: 'lendo',
        returned: 'leu',
        rafk: 'lendo',
    },
    {
        alias: ['shower', 'banho', 'banhar'],
        emoji: '🚿',
        afk: 'foi pro banho',
        isafk: 'no banho',
        returned: 'voltou do banho',
        rafk: 'pro banho',
    },
    {
        alias: ['study', 'estudar'],
        emoji: '📚',
        afk: 'foi estudar',
        isafk: 'estudando',
        returned: 'estudou',
        rafk: 'estudando',
    },
    {
        alias: ['watch', 'assistir', 'ver'],
        emoji: '📺',
        afk: 'foi assistir',
        isafk: 'assistindo',
        returned: 'assistiu',
        rafk: 'assistindo',
    },
    {
        alias: ['write', 'escrever'],
        emoji: '✍',
        afk: 'foi escrever',
        isafk: 'escrevendo',
        returned: 'escreveu',
        rafk: 'escrevendo',
    },
];

const afkInfoObjects = afkData.map(AFKInfo.fromJSON);

export { afkInfoObjects };
