import { injectable, inject } from "inversify";
import { provide } from 'inversify-binding-decorators';
<<<<<<< HEAD

@provide(SessionService)
=======
import { TYPES } from '../constants/Types';

@provide(TYPES.SessionService)
>>>>>>> a9fdcaab9d9856722a0d30fd3edbbfb7789d8e68
export class SessionService {

    public getSession(id: string) {

    }

    public createSession(penaltyReferenceDetails: any) {

    }

    public deleteSession(id: string) {

    }
}