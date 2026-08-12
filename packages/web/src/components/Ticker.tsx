import { TICKER_ITEMS } from '../constants';

/**
 * Scrolling banner above the header. Static copy by design — edit the strings
 * in TICKER_ITEMS to change it.
 *
 * It previously carried invented activity: named traders climbing the
 * leaderboard, badges, a $50K championship. Keep the lines here to claims the
 * site can actually stand behind.
 */
const Ticker = () => {
    // Duplicated so the marquee wraps without a visible gap.
    const combinedItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

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
