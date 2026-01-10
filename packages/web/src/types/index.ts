export interface Tournament {
    id: number;
    title: string;
    tier: string;
    prize: string;
    fee: string;
    participants: number;
    timeLabel: string;
    timeLeft: string;
    cover: string;
    registrationLink: string;
}

export interface Trader {
    rank: number;
    name: string;
    pnl: string;
    roi: string;
    streak: number;
    tier: string;
}
