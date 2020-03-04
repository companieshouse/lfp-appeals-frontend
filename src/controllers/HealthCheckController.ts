import { inject } from 'inversify';
import { BaseHttpController, httpGet, controller } from 'inversify-express-utils';
import { OK, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { HEALTH_CHECK_URI } from 'app/utils/Paths';
import { SessionStore } from 'ch-node-session-handler';

@controller(HEALTH_CHECK_URI)
export class HealthCheckController extends BaseHttpController {

    constructor(@inject(SessionStore) private readonly store: SessionStore) {
        super();
    }

    @httpGet('')
    public async healthCheckRedis(): Promise<void> {
        const status: number = await this.store.redis.ping().then(_ => OK).catch(() => INTERNAL_SERVER_ERROR);
        this.httpContext.response.status(status).send(`Redis status: ${status}`);
    }

}
