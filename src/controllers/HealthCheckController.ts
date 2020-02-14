import { inject } from 'inversify';
import { BaseHttpController, httpGet, controller } from 'inversify-express-utils';
import { RedisService } from '../services/RedisService';
import { OK, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { HEALTH_CHECK_URI } from '../utils/Paths';

@controller(HEALTH_CHECK_URI)
export class HealthCheckController extends BaseHttpController {

    constructor(@inject(RedisService) private readonly redisService: RedisService) {
        super();
    }

    @httpGet('')
    public healthCheckRedis(): void {
        const ping: boolean = this.redisService.ping();
        const status: number = ping ? OK : INTERNAL_SERVER_ERROR;
        this.httpContext.response.status(status).send(`Redis healthy: ${ping}`);
    }

}
