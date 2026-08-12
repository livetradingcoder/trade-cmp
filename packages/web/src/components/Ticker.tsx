import { useTournaments } from '../context/TournamentContext';
import { TICKER_ITEMS } from '../constants';

/**
 * Scrolling banner above the header.
 *
 * The competition line is built from the live tournament rather than a
 * hardcoded string, so the banner can't advertise a prize that no longer
 * matches the one in the hero. Falls back to the static claims alone when
 * nothing is active.
 *
 * It previously carried invented activity — named traders climbing the
 * leaderboard, badges, a $50K championship — none of which was real.
 */

const formatPrize = (prize: string) => {
    const digits = prize.replace(/[\s,]/g, '');
    if (!/^\d+(\.\d+)?$/.test(digits)) return prize;
    return `$${Number(digits).toLocaleString('en-US')}`;
};

/** "2 WEEKS" / "10 DAYS", or null when the dates are missing or nonsensical. */
const formatDuration = (start?: string, end?: string): string | null => {
    if (!start || !end) return null;
    const from = new Date(start).getTime();
    const to = new Date(end).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;

    const days = Math.round((to - from) / 86_400_000);
    if (days < 1) return null;
    if (days % 7 === 0) {
        const weeks = days / 7;
        return `${weeks} WEEK${weeks === 1 ? '' : 'S'}`;
    }
    return `${days} DAY${days === 1 ? '' : 'S'}`;
};

const Ticker = () => {
    const { tournaments } = useTournaments();
    const active = tournaments.find((t) => t.status === 'active') || tournaments[0];

    const items: string[] = [];

    if (active) {
        const duration = formatDuration(active.start_date, active.end_date);
        const prize = active.prize ? formatPrize(active.prize) : null;
        if (duration && prize) {
            items.push(`${duration} COMPETITION · ${prize} CASH PRIZE POOL 💰`);
        } else if (prize) {
            items.push(`${prize} CASH PRIZE POOL 💰`);
        } else if (duration) {
            items.push(`${duration} COMPETITION NOW OPEN`);
        }
    }

    // Claims that mirror the hero copy, so nothing here is unverifiable.
    items.push(...TICKER_ITEMS);

    // Duplicated so the marquee wraps without a visible gap.
    const combinedItems = [...items, ...items];

    return (
        <div className="ticker-wrap">
            <div className="ticker-content">
                {combinedItems.map((item, i) => (
                    <span key={i} className="ticker-item">
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default Ticker;
