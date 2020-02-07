class CompanyNumberValidator {

    static validateCompanyNumber(companyNumber: string): boolean {

        if (!companyNumber) {

            throw new Error("");

        }


        if (!companyNumber || companyNumber && companyNumber.length > 8) {

            return false;
        }
        return true;
    }

}

