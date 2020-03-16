import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal } from 'app/models/Appeal';
import { APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealStorageService } from 'app/service/AppealStorageService';

@provide(AppealStorageFormSubmissionProcessor)
export class AppealStorageFormSubmissionProcessor implements FormSubmissionProcessor {

    constructor(@inject(AppealStorageService) private readonly appealStorageService: AppealStorageService) {
    }

    async process(req: Request): Promise<void> {

        const accessToken = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.AccessToken])
            .map(token => token?.access_token as string)
            .unsafeCoerce();

        const appeal = req.session
            .chain(_ => _.getExtraData())
            .map(extraData => extraData[APPLICATION_DATA_KEY])
            .map(data => data.appeal as Appeal)
            .unsafeCoerce();

        await this.appealStorageService.save(appeal, accessToken);
    }
}
