import { TICKER_ITEMS } from '../constants';

const Ticker = () => {
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
