import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { IMap } from 'src/models/types';
import { RedisService } from './RedisService';


@provide(SessionService)
export class SessionService {

    constructor(@inject(RedisService) private readonly redisService: RedisService) {}

    public async getSession(cookieId: string): Promise<IMap<any>> {

        const data: IMap<any> = await this.redisService.getObject(cookieId)
        console.log(data)
        return data

    }

    public async createSession(data: IMap<any>): Promise<any> {

        const cookieId: string = this.generateNewCookieId()
        await this.redisService.setObject(cookieId, data)
    }

    public async updateSession(data: IMap<any>, cookieId: string): Promise<void>{
        await this.redisService.setObject(cookieId, data)
    }

    private generateNewCookieId(): string {
        return '1'
    }

}