export const sanitize = (companyNumber: string): string => {
    if (companyNumber.length === 0) return companyNumber
    return companyNumber.toUpperCase().padStart(8, '0')
}

// const padNumber = (companyNumber: string): string => {
//     if (companyNumber.length === 0) return companyNumber
//     return companyNumber.padStart(8, '0')
//     if(leadingLetters === 'SC' || leadingLetters === 'NI'){
//         companyNumber = companyNumber.padStart(8, '0');
//         console.log(companyNumber)
//         return companyNumber;
//     } else{
//         const trailingChars = companyNumber
//             .substring(2, companyNumber.length)
//             .padStart(6, '0');
//         companyNumber = leadingLetters + trailingChars
//         console.log(companyNumber)
//         return companyNumber;
//     }
// };