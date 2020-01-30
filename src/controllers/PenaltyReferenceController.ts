import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, BaseHttpController } from 'inversify-express-utils';
import { inject } from 'inversify';
import { RedisService } from '../services/RedisService';

@controller('/penalty-reference')
export class PenaltyReferenceController extends BaseHttpController {

    constructor(@inject('RedisService') private redisService: RedisService) {
        super();
    }

    @httpGet('/')
    public home(req: Request, res: Response, next: NextFunction): void {
        const session = this.redisService.createNewSession();
        session.on('connect', () => console.log('Connected.'));
        session.set('session', 'New Session');
        res.render('penalty-reference');
    }

}
