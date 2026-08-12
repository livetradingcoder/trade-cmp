import { useTournaments } from '../context/TournamentContext';
import { TICKER_ITEMS } from '../constants';
import { competitionDuration, formatPrize } from '../utils/competition';

/**
 * Scrolling banner above the header.
 *
 * The competition line is built from the live tournament rather than a
 * hardcoded string, so it can't advertise a prize that disagrees with the hero
 * directly below it — both read the same helpers.
 *
 * It previously carried invented activity — named traders climbing the
 * leaderboard, badges, a $50K championship — none of which was real.
 */
const Ticker = () => {
    const { tournaments } = useTournaments();
    const active = tournaments.find((t) => t.status === 'active') || tournaments[0];

    const items: string[] = [];

    if (active) {
        const duration = competitionDuration(active);
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
