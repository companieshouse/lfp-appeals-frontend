export const dateToString = (date: Date): string => {

    if(isNaN(date.getDate())){
        throw new Error('DateFormatter - Invalid date');
    }

    const day: string = date.getDate().toString().padStart(2, '0');
    const month: string = (date.getMonth() + 1).toString().padStart(2, '0');
    const year: string = date.getFullYear().toString();

    return `${year}-${month}-${day}`;
};
