import { Session } from 'ch-node-session-handler';
import moment from 'moment';

import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';
import { Reasons } from 'app/models/Reasons';
import { IllPerson } from 'app/models/fields/IllPerson';
import { ReasonType } from 'app/models/fields/ReasonType';

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
    const extraData: ApplicationData | undefined = session?.getExtraData(APPLICATION_DATA_KEY);
    const reason = extraData?.appeal.reasons || {} as Reasons;

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

export const getIllnessEndDate = (session: Session | undefined): string | undefined => {
    const extraData: ApplicationData | undefined = session?.getExtraData(APPLICATION_DATA_KEY);
    const reason = extraData?.appeal?.reasons || {} as Reasons;

    return reason?.illness?.illnessEnd;
};

export const formatDate = (inputDate: string ): string => {
    return moment(inputDate).format('D MMMM YYYY');
};
