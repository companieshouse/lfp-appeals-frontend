export function dateFilter(value: string): string {

    const dateRegex: RegExp = /(\d{4})-(\d{2})-(\d{2})/;
    if (!dateRegex.test(value)) {
        throw new Error(`Input should be formatted as yyyy-MM-dd: ${value}`);
    }

    // tslint:disable-next-line: prefer-const
    const [year, month, day] = value.split('-').map(i => {
        return parseInt(i, 10);
    });

    if (month > 12 || month < 1) {
        throw new Error(`Input contains invalid month: ${value}`);
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
