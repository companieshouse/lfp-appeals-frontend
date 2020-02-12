import { injectable, inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { Session } from '../models/Session';
import * as crypto from 'crypto';
import { IMap } from 'src/models/types';
import { RedisService } from './RedisService';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';


@provide(SessionService)
export class SessionService {

    private body: PenaltyReferenceDetails | undefined

    constructor(@inject(RedisService) private readonly redisService: RedisService) {}

    public async getSession(cookieId: string): Promise<IMap<any>> {
        return this.redisService.getObject(cookieId)
    }

    public getBody(){
        return this.body
    }

    public setBody(body: PenaltyReferenceDetails){
        this.body = body
    }

    public async createSession(penaltyReferenceDetails: PenaltyReferenceDetails): Promise<any> {
        const cookieId: string = this.generateNewCookieId()
        const data: IMap<any> = {
            penaltyReference: penaltyReferenceDetails.penaltyReference,
            companyNumber: penaltyReferenceDetails.companyNumber
        }
        //const session = new Session(cookieId, data);
        await this.redisService.setObject(cookieId, data)
    }

    private generateNewCookieId(): string {
        return '1'
    }
}