export enum Region {
    SC = 'SC', NI = 'NI', DEFAULT = 'DEFAULT'
}

export const findRegionByCompanyNumber = (companyNumber: string): Region => {
    for (const region in Region) {
        if (companyNumber.startsWith(region)) {
            return Region[region as keyof typeof Region];
        }
    }
    return Region.DEFAULT
};
