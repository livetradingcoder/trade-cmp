/**
 * Prize formatting for the marketing pages.
 *
 * Competition copy (duration, prize wording) is deliberately static — see
 * TICKER_ITEMS and the hero label. This only normalises the amount the admin
 * enters, which is still read from the live tournament.
 */

/** "2000" -> "$2,000". Non-numeric prizes pass through untouched. */
export const formatPrize = (prize: string) => {
    const digits = prize.replace(/[\s,]/g, '');
    if (!/^\d+(\.\d+)?$/.test(digits)) return prize;
    return `$${Number(digits).toLocaleString('en-US')}`;
};
