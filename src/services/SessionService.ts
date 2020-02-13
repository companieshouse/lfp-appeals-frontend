import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';
import { RedisService } from './RedisService';


@provide(SessionService)
export class SessionService {

    constructor(@inject(RedisService) private readonly redisService: RedisService) {}

    public async getSession(cookieId: string): Promise<Record<string, any>> {

        const data: Record<string, any> = await this.redisService.getObject(cookieId)
        console.log(data)
        return data

    }

    public async createSession(data: Record<string, any>): Promise<any> {

        const cookieId: string = this.generateNewCookieId()
        await this.redisService.setObject(cookieId, data)
    }

    public async updateSession(data: Record<string, any>, cookieId: string): Promise<void>{
        await this.redisService.setObject(cookieId, data)
    }

    private generateNewCookieId(): string {
        return '1'
    }

}