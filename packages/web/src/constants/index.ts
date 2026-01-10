export const ASSETS = {
    LAPTOP: "https://cdn.prod.website-files.com/6744517d5c3f38b0075a477b/6744517d5c3f38b0075a506c_a.avif",
    LEADERBOARD_SNIPPET: "https://cdn.prod.website-files.com/6744517d5c3f38b0075a477b/68a5c31442709f17bf863a4e_dsvds.avif",
    REWARD_TIERS: "https://cdn.prod.website-files.com/6744517d5c3f38b0075a477b/6744517d5c3f38b0075a4cd8_klwkls.avif",
    USER_BADGE: "https://cdn.prod.website-files.com/6744517d5c3f38b0075a477b/6744517d5c3f38b0075a4f72_kmdcs.avif",
    TOURNAMENT_COVER: "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
    CHEST: "https://cdn.prod.website-files.com/6744517d5c3f38b0075a477b/6744517d5c3f38b0075a4f31_treasure_chest_open_black.avif"
};

export const CHAMPIONSHIPS = [
    {
        id: 1,
        title: 'January Clash',
        tier: 'Weekly',
        prize: '50K Challenge',
        fee: 'Free',
        participants: 1481,
        timeLabel: 'Ends in',
        timeLeft: '27d 20:17:59',
        cover: ASSETS.TOURNAMENT_COVER,
        registrationLink: import.meta.env.VITE_LINK_WEEKLY_ALPHA || 'https://tradingview.com'
    },
    {
        id: 2,
        title: 'Wednesday Clash',
        tier: 'Weekly',
        prize: '50K Challenge',
        fee: 'Free',
        participants: 18,
        timeLabel: 'Starts in',
        timeLeft: '4d 20:17:59',
        cover: ASSETS.TOURNAMENT_COVER,
        registrationLink: import.meta.env.VITE_LINK_DAY_TRADER_DUEL || 'https://tradingview.com'
    },
    {
        id: 3,
        title: 'February Clash',
        tier: 'Monthly',
        prize: '50K Challenge',
        fee: 'Free',
        participants: 7,
        timeLabel: 'Starts in',
        timeLeft: '30d 20:17:59',
        cover: ASSETS.TOURNAMENT_COVER,
        registrationLink: import.meta.env.VITE_LINK_MONTHLY_MOONSHOT || 'https://tradingview.com'
    },
];

export const TOP_TRADERS = [
    { rank: 1, name: 'CryptoKev', pnl: '+$42,450', roi: '142%', streak: 8, tier: 'Elite' },
    { rank: 2, name: 'PaperHands_RIP', pnl: '+$38,120', roi: '115%', streak: 5, tier: 'Elite' },
    { rank: 3, name: 'SatoshiGhost', pnl: '+$29,800', roi: '98%', streak: 12, tier: 'Elite' },
    { rank: 4, name: 'TraderJoe', pnl: '+$15,200', roi: '76%', streak: 3, tier: 'Gold' },
    { rank: 5, name: 'AlphaSeeker', pnl: '+$12,400', roi: '62%', streak: 4, tier: 'Gold' },
];

export const TICKER_ITEMS = [
    "NEW MONTHLY CHAMPIONSHIP OPENED: $50K REWARDS! 💰",
    "NEW SIDE QUEST: 'MOST VOLATILE TRADE OF THE DAY' IS NOW ACTIVE! ⚡",
    "CRYPTOKEV JUST JUMPED 12 SPOTS ON THE LEADERBOARD! 🔥",
    "SATOSHIGHOST COMPLETED A 'HAT TRICK': 3 WINNING TRADES IN A ROW! 🎩",
    "TRADERJOE EARNED THE 'COMEBACK KING' BADGE! 👑",
];
