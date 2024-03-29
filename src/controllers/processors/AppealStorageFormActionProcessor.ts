import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey";
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces";
import { Request } from "express";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";

import { FormActionProcessor } from "app/controllers/processors/FormActionProcessor";
import { loggerInstance } from "app/middleware/Logger";
import { Appeal } from "app/models/Appeal";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { AppealsService } from "app/modules/appeals-service/AppealsService";

@provide(AppealStorageFormActionProcessor) // eslint-disable-line no-use-before-define
export class AppealStorageFormActionProcessor implements FormActionProcessor {

    constructor (@inject(AppealsService) private readonly appealsService: AppealsService) {
    }

    async process (req: Request): Promise<void> {

        if (!req.session) {
            throw new Error("Session is undefined");
        }

        const signInInfo: ISignInInfo | undefined = req.session!.get<ISignInInfo>(SessionKey.SignInInfo);

        const userId: string | undefined = signInInfo?.user_profile?.id;

        const accessToken: string | undefined = signInInfo?.access_token?.access_token;

        const refreshToken: string | undefined = signInInfo?.access_token?.refresh_token;

        const applicationData: ApplicationData = req.session!
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const appeal: Appeal = applicationData.appeal;

        appeal.createdBy = appeal.createdBy || {};
        appeal.createdBy.emailAddress = signInInfo?.user_profile?.email;
        appeal.createdBy.id = signInInfo?.user_profile?.id;

        loggerInstance()
            .debug(`${AppealStorageFormActionProcessor.name} - process: Saving appeal with data ${JSON.stringify(appeal)}`);
        loggerInstance()
            .info(`${AppealStorageFormActionProcessor.name} - process: Saving appeal for userId: ${userId}`);

        appeal.id = await this.appealsService.save(appeal, accessToken!, refreshToken!);
    }
}
