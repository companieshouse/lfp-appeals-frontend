export function dateFilter(value: string ): string {
    // tslint:disable-next-line: prefer-const
    let [year, month, day] = value.split('-').map(i => {
        return parseInt(i, 10);
    });

    if (!year || !month || !day || month > 11 || month < 0) {
        throw new Error('Input should be an ISO-formatted date string');
    }

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    return `${day} ${months[month-1]} ${year}`;
}