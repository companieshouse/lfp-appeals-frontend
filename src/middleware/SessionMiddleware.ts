import { provide } from "inversify-binding-decorators";
import { BaseMiddleware, request } from 'inversify-express-utils';
import { Request, Response, NextFunction } from 'express';
import { inject } from 'inversify';

import { SessionService } from '../services/SessionService';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';

@provide(SessionMiddleware)

export class SessionMiddleware extends BaseMiddleware {

    constructor(@inject(SessionService) private readonly sessionService: SessionService) {
        super()
    }

    async handler(req: Request, res: Response, next: NextFunction): Promise<void> {

        const cookieId = req.cookies['penalty-cookie']

        if (cookieId) {
            console.log('Cookie found, loading session')
            await this.sessionService.getSession(cookieId).then(data => {
                console.log(data)
                const body: PenaltyReferenceDetails = new PenaltyReferenceDetails(
                    data['companyNumber'], data['penaltyReference']);

                console.log(data['companyNumber'])
                console.log(data['penaltyReference'])
                this.sessionService.setBody(body)
                next();
            })

        } else {
            console.log('No cookie')
            next();
        }
    }

}
