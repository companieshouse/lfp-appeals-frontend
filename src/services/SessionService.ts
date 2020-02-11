import { injectable, inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { Session } from '../models/Session';
import * as crypto from 'crypto';
import { IMap } from 'src/models/types';
import { RedisService } from './RedisService';
import { PenaltyReferenceDetails } from '../models/PenaltyReferenceDetails';


@provide(SessionService)
export class SessionService {
    constructor(@inject(RedisService) private readonly redisService: RedisService) {}

    public getSession(cookieId: string): IMap<any> {
        return this.redisService.getObject(cookieId)
    }

    public async createSession(penaltyReferenceDetails: PenaltyReferenceDetails): Promise<any> {
        const cookieId: string = this.generateNewCookieId()
        const data: IMap<any> = {
            penaltyReference: penaltyReferenceDetails.penaltyReference,
            companyNumber: penaltyReferenceDetails.companyNumber
        }
        const session = new Session(cookieId, data);
        await this.redisService.setObject(session.cookieId, session.data)
    }

    public deleteSession(id: string) {
    }

    private static generateSignature(sessionKey: string): string {
        const hash = crypto.createHash('sha1');
        const data = hash.update(sessionKey + 'PLEASE CHANGE ME');
        const buff = data.digest();
        const sig = buff.toString('base64');
        return sig.substr(0, sig.indexOf('='));
      }


    private static generateSessionKey(): string {
        const bytes = crypto.randomBytes(21);
        return bytes.toString('base64');
    }

    private generateNewCookieId(): string {
        const key = SessionService.generateSessionKey();
        return key + SessionService.generateSignature(key);
    }
}