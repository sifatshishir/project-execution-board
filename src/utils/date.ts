import { Task } from '../features/board/domain/schema';

export const parseEstimateToMs = (estimate: string): number | null => {
    if (!estimate) return null;
    const match = estimate.match(/(\d+)([hm])/);
    if (!match) return null;
    const val = parseInt(match[1]);
    const unit = match[2];
    // h = hours, m = minutes
    return unit === 'h' ? val * 60 * 60 * 1000 : val * 60 * 1000;
};

export const getTaskTimeStatus = (task: Task) => {
    if (!task.startDate || !task.estimate) return { isOverdue: false, text: '' };

    const duration = parseEstimateToMs(task.estimate);
    if (!duration) return { isOverdue: false, text: '' };

    const endTime = task.startDate + duration;
    const now = Date.now();
    const isOverdue = now > endTime;

    // Format end time
    const endDate = new Date(endTime);
    const timeString = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = endDate.toLocaleDateString();

    // Check if it's today
    const isToday = new Date().toDateString() === endDate.toDateString();
    const displayString = isToday ? timeString : `${dateString} ${timeString}`;

    return {
        isOverdue,
        text: displayString,
        endTime
    };
};

// Generate a consistent color based on a string (e.g., task ID or title)
export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use HSL for better spread and consistent brightness
    // Hue: 0-360 based on hash
    const h = Math.abs(hash) % 360;
    // Saturation: 65-85% for vibrancy
    const s = 70 + (Math.abs(hash) % 20);
    // Lightness: 45-60% for readability against both light/dark (border usage)
    const l = 50 + (Math.abs(hash) % 15);

    return `hsl(${h}, ${s}%, ${l}%)`;
};
