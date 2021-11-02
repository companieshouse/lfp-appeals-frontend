import { Session } from 'ch-node-session-handler';
import { Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp/types';
import Resource from 'ch-sdk-node/dist/services/resource';
import { OK } from 'http-status-codes';
import moment from 'moment';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';
import { Reasons } from 'app/models/Reasons';
import { IllPerson } from 'app/models/fields/IllPerson';
import { ReasonType } from 'app/models/fields/ReasonType';
import { REVIEW_PENALTY_PAGE_URI } from 'app/utils/Paths';

const getReasonFromSession = (session: Session | undefined) => {
    const extraData: ApplicationData | undefined = session?.getExtraData(APPLICATION_DATA_KEY);
    return extraData?.appeal.reasons || {} as Reasons;
};

export const getReasonType = (reasons: Reasons): ReasonType => {
    return (ReasonType.illness in reasons && reasons.illness && !reasons.other)
        ? ReasonType.illness
        : ReasonType.other;
};

export const getReasonFromReasons = (reasons: Reasons): Illness | OtherReason | undefined => {
    if(!reasons){
        return reasons;
    }else{
        return (getReasonType(reasons) === ReasonType.illness)
            ? reasons.illness
            : reasons.other;
    }
};

export const getAttachmentsFromReasons = (reasons: Reasons): Attachment[] | undefined => {
    return getReasonFromReasons(reasons)?.attachments;
};

export const findAttachmentByIdFromReasons = (reasons: Reasons, fileId: string): Attachment | undefined => {
    const attachments = getAttachmentsFromReasons(reasons);

    return attachments?.find(attachment => attachment.id === fileId);
};

export const removeAttachmentFromReasons = (reasons: Reasons, attachment: Attachment): void => {
    const reason = getReasonFromReasons(reasons);

    reason!.attachments!.splice(reason!.attachments!.indexOf(attachment), 1);
};

export const addAttachmentToReason = (reasons: Reasons, attachment: Attachment): void => {
    const reason = getReasonFromReasons(reasons);

    reason!.attachments = [...reason!.attachments || [], attachment];
};

export const isIllnessReason = (session: Session | undefined): boolean => {
    const reason = getReasonFromSession(session);

    return getReasonType(reason) === ReasonType.illness;
};

export const addPermissionToNavigation = (extraData: ApplicationData, pageURI: string) => {
    extraData.navigation = {
        permissions: [
            ...extraData.navigation.permissions,
            pageURI
        ]
    };
};

export const getIllPersonFromIllnessReason = (illnessReasons: Illness): string => {
    const illPerson = illnessReasons.illPerson;
    return ( illPerson === IllPerson.someoneElse )
            ? illnessReasons.otherPerson!
            : illPerson.charAt(0).toUpperCase() + illPerson.substring(1);
};

export const checkContinuedIllness = (session: Session | undefined): boolean | undefined => {
    const reason = getReasonFromSession(session);

    return reason?.illness!.continuedIllness;
};

export const formatDate = (inputDate: string ): string => {
    return moment(inputDate).format('D MMMM YYYY');
};

export const getApplicationExtraData = (session: Session): ApplicationData => {
    const appDataEmpty: ApplicationData = { appeal: {} as Appeal, navigation: { permissions: [] } };
    return session.getExtraData(APPLICATION_DATA_KEY) || appDataEmpty;
};

export const getPenaltiesItems = (
    session: Session,
    accessToken: string,
    penalties: Resource<PenaltyList>): Penalty[] => {

    if (penalties.httpStatusCode !== OK || !penalties.resource) {
        throw new Error(`PenaltyDetailsValidator: failed to get penalties from pay API with status code ${penalties.httpStatusCode} with access token ${accessToken}`);
    }

    let filteredPenaltiesItems: Penalty[] = penalties.resource.items.filter(penalty => penalty.type === 'penalty');

    if (filteredPenaltiesItems && filteredPenaltiesItems.length) {
        if (filteredPenaltiesItems.length === 1) {
            const applicationData = getApplicationExtraData(session);

            addPermissionToNavigation(applicationData, REVIEW_PENALTY_PAGE_URI);
            session.setExtraData(APPLICATION_DATA_KEY, applicationData);
        }

        filteredPenaltiesItems = filteredPenaltiesItems.map(item => {
            item.madeUpDate = moment(item.madeUpDate).format('D MMMM YYYY');
            item.transactionDate = moment(item.transactionDate).format('D MMMM YYYY');
            return item;
        });
    }

    return filteredPenaltiesItems;
};
