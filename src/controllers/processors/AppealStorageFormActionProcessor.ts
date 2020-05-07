import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { loggerInstance } from 'app/middleware/Logger';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';

@provide(AppealStorageFormActionProcessor)
export class AppealStorageFormActionProcessor implements FormActionProcessor {

    constructor(@inject(AppealsService) private readonly appealsService: AppealsService) {
    }

    async process(req: Request): Promise<void> {

        const signInInfo = req.session
            .map(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .unsafeCoerce();

        const userId = signInInfo
            .map(info => info[SignInInfoKeys.UserProfile])
            .map(userProfile => userProfile?.id as string)
            .unsafeCoerce();

        const accessTokenMaybe = signInInfo
            .map(info => info[SignInInfoKeys.AccessToken]);

        const accessToken: string = accessTokenMaybe
            .map(token => token?.access_token as string)
            .unsafeCoerce();

        const refreshToken: string = accessTokenMaybe
            .map(token => token?.refresh_token as string)
            .unsafeCoerce();

        const appeal = req.session
            .chain(_ => _.getExtraData())
            .map<ApplicationData>(data => data[APPLICATION_DATA_KEY])
            .map(data => data.appeal)
            .unsafeCoerce();

        loggerInstance()
            .debug(`${AppealStorageFormActionProcessor.name} - process: Saving appeal with data ${JSON.stringify(appeal)}`);
        loggerInstance()
            .info(`${AppealStorageFormActionProcessor.name} - process: Saving appeal for userId: ${userId}`);

        appeal.id = await this.appealsService.save(appeal, accessToken, refreshToken);
    }
}
