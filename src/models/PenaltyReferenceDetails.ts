import { provide } from 'inversify-binding-decorators';
import { TYPES } from '../constants/Types'

interface IPenaltyReferenceDetails {
  companyNumber: string;
  referenceNumber: string;
  _id?: string;
}

@provide(TYPES.PenaltyReferenceDetails)
export class PenaltyReferenceDetails implements IPenaltyReferenceDetails {
  constructor(
    public companyNumber: string,
    public referenceNumber: string,
    public _id?: string
  ) { }
}