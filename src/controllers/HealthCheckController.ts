import { inject } from 'inversify';
import { BaseHttpController, httpGet, controller } from 'inversify-express-utils';
import { RedisService } from '../services/RedisService';
import { TYPES } from '../InjectableTypes';
import { HealthCheckModel } from '../models/HealthCheckModel';
import { OK, INTERNAL_SERVER_ERROR } from 'http-status-codes';

@controller('/healthCheck')
export abstract class HealthCheckController extends BaseHttpController {

    constructor(@inject(TYPES.RedisService) private readonly redisService: RedisService) {
        super();
    }

    @httpGet('')
    public async healthCheckRedis(): Promise<void> {
        await this.sendInfoRedis();
    }

    private async sendInfoRedis(): Promise<void> {
        const obj: HealthCheckModel = await this.redisService.checkHealth();
        const ping = this.redisService.ping();
        const status = ping ? OK : INTERNAL_SERVER_ERROR;
        this.httpContext.response.status(status).send(
            `
            <p>Redis healthy:  ${ping}</p>
            `
        );

    }

}