export function formatCompactNumber(number) {
    if (number < 1000) return number.toString();
    const si = [
        { value: 1e9, symbol: "B" },
        { value: 1e6, symbol: "M" },
        { value: 1e3, symbol: "K" }
    ];
    for (let i = 0; i < si.length; i++) {
        if (number >= si[i].value) {
            return (number / si[i].value).toFixed(1).replace(/\.0$/, "") + si[i].symbol;
        }
    }
    return number.toString();
}

export function formatRelativeTime(date, lang = 'en', justNowText = 'just now') {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 10) return justNowText;

    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    
    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return rtf.format(-diffInMinutes, 'minute');

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return rtf.format(-diffInHours, 'hour');

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return rtf.format(-diffInDays, 'day');

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return rtf.format(-diffInWeeks, 'week');

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return rtf.format(-diffInMonths, 'month');

    const diffInYears = Math.floor(diffInDays / 365);
    return rtf.format(-diffInYears, 'year');
}

