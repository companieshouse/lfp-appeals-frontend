import { injectable, inject } from "inversify";
import { provide } from 'inversify-binding-decorators';
import { TYPES } from '../constants/Types';

@provide(TYPES.SessionService)
export class SessionService {

    public getSession(id: string) {

    }

    public createSession(penaltyReferenceDetails: any) {

    }

    public deleteSession(id: string) {

    }
}