export const dateToString = (date: Date): string => {
    const day: string = date.getDate().toString(10).padStart(2, '0');
    const month: string = (date.getMonth() + 1).toString(10).padStart(2, '0');
    const year: string = date.getFullYear().toString();
    console.log(month);

    return `${year}-${month}-${day}`;
};
