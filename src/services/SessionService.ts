import { injectable, inject } from "inversify";
import { provide } from 'inversify-binding-decorators';

@provide(SessionService)
export class SessionService {

    public getSession(id: string) {

    }

    public createSession(penaltyReferenceDetails: any) {

    }

    public deleteSession(id: string) {

    }
}