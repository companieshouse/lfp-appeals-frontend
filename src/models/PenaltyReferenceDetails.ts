import { provide } from 'inversify-binding-decorators';
<<<<<<< HEAD
=======
import { TYPES } from '../constants/Types'
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68

interface IPenaltyReferenceDetails {
  companyNumber: string;
  referenceNumber: string;
  _id?: string;
}

<<<<<<< HEAD
@provide(PenaltyReferenceDetails)
=======
@provide(TYPES.PenaltyReferenceDetails)
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68
export class PenaltyReferenceDetails implements IPenaltyReferenceDetails {
  constructor(
    public companyNumber: string,
    public referenceNumber: string,
    public _id?: string
  ) { }
}