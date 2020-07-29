export function dateFilter(value: string ): string {
    // tslint:disable-next-line: prefer-const
    let [year, month, day] = value.split('-').map(i => {
        return parseInt(i, 10);
    });

    if (!year || !month || !day) {
        throw new Error('Input should be an ISO-formatted date string');
    }

    month--; // Months are indexed from zero

    return new Date(year, month, day).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}