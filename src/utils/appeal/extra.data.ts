import { Session } from 'ch-node-session-handler';

import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';
import { Reasons } from 'app/models/Reasons';
import { ReasonType } from 'app/models/fields/ReasonType';

const getReasonType = (reasons: Reasons): ReasonType => {
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

export const isIllnessReason = (session: Session | undefined) => {
    const extraData: ApplicationData | undefined = session?.getExtraData(APPLICATION_DATA_KEY);
    const reason = extraData?.appeal.reasons || {} as Reasons;

    return getReasonType(reason) === ReasonType.illness;
};
