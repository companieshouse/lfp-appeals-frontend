import { SessionStore } from "@companieshouse/node-session-handler";
import { INTERNAL_SERVER_ERROR, OK } from "http-status-codes";
import { inject } from "inversify";
import { controller, httpGet, BaseHttpController } from "inversify-express-utils";

import { HEALTH_CHECK_URI } from "app/utils/Paths";

@controller(HEALTH_CHECK_URI)
export class HealthCheckController extends BaseHttpController {

    constructor (@inject(SessionStore) private readonly store: SessionStore) {
        super();
    }

    @httpGet("")
    public async healthCheckRedis (): Promise<void> {
        const status: number = await this.store.redis.ping().then(_ => OK).catch(() => INTERNAL_SERVER_ERROR);
        this.httpContext.response.status(status).send(`Redis status: ${status}`);
    }

}
