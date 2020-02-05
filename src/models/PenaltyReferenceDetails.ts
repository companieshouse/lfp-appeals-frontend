import { provide } from 'inversify-binding-decorators';

interface IPenaltyReferenceDetails {
  companyNumber: string;
  referenceNumber: string;
  _id?: string;
}

@provide(PenaltyReferenceDetails)
export class PenaltyReferenceDetails implements IPenaltyReferenceDetails {
  constructor(
    public companyNumber: string,
    public referenceNumber: string,
    public _id?: string
  ) { }
}