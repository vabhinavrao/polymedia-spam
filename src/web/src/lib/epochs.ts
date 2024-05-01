export type EpochData = {
    epochNumber: number;
    durationMs: number;
    startTimeMs: number;
};

/**
 * Calculates the start and end timestamps for a given epoch number.
 */
export function getEpochTimes(
    targetEpochNumber: number,
    currentEpochData: EpochData
): { startTime: Date; endTime: Date }
{
    const { epochNumber: currEpoch, durationMs, startTimeMs: currEpochStartMs } = currentEpochData;

    const epochDiff = targetEpochNumber - currEpoch;
    const startTime = new Date(currEpochStartMs + epochDiff * durationMs);
    const endTime = new Date(startTime.getTime() + durationMs);

    return { startTime, endTime };
}

export function formatEpochTime(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (date.toDateString() === tomorrow.toDateString()) {
        return `tomorrow at ${hours}:${minutes}`;
    } else if (date.toDateString() === today.toDateString()) {
        return `today at ${hours}:${minutes}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `yesterday at ${hours}:${minutes}`;
    } else if (date > tomorrow && date < oneWeekLater) {
        // Date is after tomorrow but within a week
        const weekday = date.toLocaleString("en-US", { weekday: "short" }); // e.g., "Thu"
        return `${weekday} at ${hours}:${minutes}`;
    } else {
        // Date is more than a week ago or in the future
        const month = date.toLocaleString("en-US", { month: "short" }); // e.g., "Apr"
        const day = date.getDate();
        return `${month} ${day} at ${hours}:${minutes}`;
    }
}
