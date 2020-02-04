import { inject } from 'inversify';
import { BaseHttpController, httpGet, controller } from 'inversify-express-utils';
import { RedisService } from '../services/RedisService';
import { TYPES } from '../InjectableTypes';

@controller('/')
export abstract class AbstractRestController extends BaseHttpController {

    constructor(@inject(TYPES.RedisService) protected readonly redisService: RedisService) {
        super();
    }

    @httpGet('healthCheck')
    public async healthCheck(): Promise<void> {
        await this.sendInfo();
    }

    private async sendInfo(): Promise<void> {
        const obj: any = await this.redisService.checkHealth();
        this.httpContext.response.send(
            `
            <p>Redis online:  ${this.redisService.ping()}</p>
            <p>Number of Times Visited: ${obj.n}\n</p>
            <p>Last time visited: ${obj.lastTimeVisited}\n</p>
            `
        );
    }

}