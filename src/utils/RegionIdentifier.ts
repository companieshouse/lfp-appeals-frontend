const SCOTLAND_PREFIX: string = 'SC';
const NORTHERN_IRELAND_PREFIX: string = 'NI';

export const companyNumberRegionIdentifier = (companyNumber: string)=> {

    const regionPrefix: string = companyNumber.slice(0,2);

    if (regionPrefix === SCOTLAND_PREFIX){
        return process.env.SC_TEAM_EMAIL;
    }
    else if(regionPrefix === NORTHERN_IRELAND_PREFIX){
        return process.env.NI_TEAM_EMAIL;
    }
    return process.env.DEFAULT_TEAM_EMAIL
};
