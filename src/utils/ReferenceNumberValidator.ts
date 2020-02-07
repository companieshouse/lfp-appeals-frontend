
class ReferenceNumberValidator {

    static validateReferenceNumber(referenceNumber: string): boolean {

        if (!referenceNumber || referenceNumber && referenceNumber.length != 9) {

            return false;
        }
        return true;
    }

}