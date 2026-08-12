/**
 * Shared formatting for how a competition is described on the marketing pages.
 *
 * The hero and the ticker both advertise the same competition, so they read
 * these helpers rather than each formatting it themselves — otherwise the two
 * can quietly disagree on the same screen.
 */

/** "2000" -> "$2,000". Non-numeric prizes pass through untouched. */
export const formatPrize = (prize: string) => {
    const digits = prize.replace(/[\s,]/g, '');
    if (!/^\d+(\.\d+)?$/.test(digits)) return prize;
    return `$${Number(digits).toLocaleString('en-US')}`;
};

/** "2 WEEKS" / "10 DAYS", or null when the dates are missing or nonsensical. */
export const formatDuration = (start?: string, end?: string): string | null => {
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

/**
 * The tier is a cadence label ("Bi-Weekly"), not a run length, so translate the
 * known ones into how long a competition actually lasts. Anything unrecognised
 * falls through to the label itself rather than guessing.
 */
const TIER_DURATIONS: Record<string, string> = {
    daily: '1 DAY',
    weekly: '1 WEEK',
    'bi-weekly': '2 WEEKS',
    biweekly: '2 WEEKS',
    fortnightly: '2 WEEKS',
    monthly: '1 MONTH',
};

export const durationFromTier = (tier?: string): string | null => {
    if (!tier) return null;
    return TIER_DURATIONS[tier.trim().toLowerCase()] || tier.toUpperCase();
};

/**
 * How long the competition runs. Real dates win; the cadence tier is the
 * fallback for a competition that has none set, which is common in draft.
 */
export const competitionDuration = (tournament: {
    start_date?: string;
    end_date?: string;
    tier?: string;
}): string | null =>
    formatDuration(tournament.start_date, tournament.end_date) ||
    durationFromTier(tournament.tier);
