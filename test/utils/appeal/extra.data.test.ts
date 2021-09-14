import { expect } from 'chai';
import { createSession } from '../session/SessionFactory';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { Illness } from 'app/models/Illness';
import { Navigation } from 'app/models/Navigation';
import { OtherReason } from 'app/models/OtherReason';
import { Reasons } from 'app/models/Reasons';
import { IllPerson } from 'app/models/fields/IllPerson';
import {
    addAttachmentToReason,
    addPermissionToNavigation,
    findAttachmentByIdFromReasons,
    formatDate,
    getAttachmentsFromReasons,
    getIllnessEndDate,
    getIllPersonFromIllnessReason,
    getReasonFromReasons,
    isIllnessReason,
    removeAttachmentFromReasons
} from 'app/utils/appeal/extra.data';

describe('Appeal Extra Data', () => {
    const appealReasonAttachments: Attachment[] = [ {
        id: '123',
        name: 'readme.txt',
        contentType: 'text/plain',
        size: 1234,
        url: 'someUri/prompt/123?c=00006411'
    },
    {
        id: '3221',
        name: 'robot.txt',
        contentType: 'text/plain',
        size: 3215,
        url: 'someUri/prompt/3221?c=00006411'
    }];
    const appealIllnessReason = {
        reasons: {
            illness: {
                illPerson: IllPerson.director,
                illnessStart: '2020-02-03',
                illnessEnd: '2020-02-04',
                continuedIllness: 'yes',
                attachments: [appealReasonAttachments[0]]
            } as Illness
        }
    } as Appeal;
    const appealOtherReason = {
        reasons: {
            other: {
                title: 'I have reasons',
                description: 'they are legit',
                attachments: [appealReasonAttachments[1]]
            } as OtherReason
        }
    } as Appeal;
    const secondAttachment = {
        id: '555',
        name: 'test.txt',
        contentType: 'text/plain',
        size: 6126,
        url: 'someUri/prompt/555?c=00006411'
    } as Attachment;
    const navigation: Navigation = { permissions: [] };

    it('shoult return other reason object from Reasons', () => {
        const reason = getReasonFromReasons(appealOtherReason.reasons);
        expect(reason).to.be.equal(appealOtherReason.reasons.other);
    });

    it('shoult return illness reason object from Reasons', () => {
        const reason = getReasonFromReasons(appealIllnessReason.reasons);
        expect(reason).to.be.equal(appealIllnessReason.reasons.illness);
    });

    it('should return attachments from illness reason', () => {
        const attachments = getAttachmentsFromReasons(appealIllnessReason.reasons);
        expect(attachments).to.be.deep.equal([appealReasonAttachments[0]]);
    });

    it('should return attachments from other reason', () => {
        const attachments = getAttachmentsFromReasons(appealOtherReason.reasons);
        expect(attachments).to.be.deep.equal([appealReasonAttachments[1]]);
    });

    it('should return undefined from searching attachment on empty object', () => {
        const attachments = getAttachmentsFromReasons({} as Reasons);
        expect(attachments).to.be.equal(undefined);
    });

    it('should return the attachment object from other reson', () => {
        const attachment = findAttachmentByIdFromReasons(appealOtherReason.reasons, '3221');
        expect(attachment).to.be.deep.equal(appealReasonAttachments[1]);
    });

    it('should return undefined from searching attachment by ID on empty object', () => {
        const attachment = findAttachmentByIdFromReasons({} as Reasons, '3221');
        expect(attachment).to.be.equal(undefined);
    });

    it('should remove the 3221 attachment and return empty list from other reson', () => {
        removeAttachmentFromReasons(appealOtherReason.reasons, appealReasonAttachments[1]);
        expect(appealOtherReason.reasons.other?.attachments).to.be.deep.equal([]);
        expect(appealOtherReason.reasons.other?.attachments?.length).to.be.equal(0);
    });

    it('should add a second attachment to illness reason', () => {
        addAttachmentToReason(appealIllnessReason.reasons, secondAttachment);
        expect(appealIllnessReason.reasons.illness?.attachments)
                    .to.be.deep.equal([appealReasonAttachments[0], secondAttachment]);
        expect(appealIllnessReason.reasons.illness?.attachments?.length).to.be.equal(2);
    });

    it('should return undefined from adding attachment to an empty object', () => {
        const emptyAttachments = { reasons: { other: {title: 'xyz'} as OtherReason } } as Appeal;
        addAttachmentToReason( emptyAttachments.reasons, secondAttachment);
        expect(emptyAttachments.reasons.other?.attachments).to.be.deep.equal([secondAttachment]);
        expect(emptyAttachments.reasons.other?.attachments?.length).to.be.equal(1);
    });

    it('should return false when appeal has got Other type on reason object', () => {
        const session = createSession('secret');
        const mockExtraData = { appeal: appealOtherReason as Appeal } as ApplicationData;

        session.setExtraData(APPLICATION_DATA_KEY, mockExtraData);

        const typeReason = isIllnessReason(session);
        expect(typeReason).to.be.equal(false);
    });

    it('should return true when appeal has got Illness type on reason object', () => {
        const session = createSession('secret');
        const mockExtraData = { appeal: appealIllnessReason as Appeal } as ApplicationData;

        session.setExtraData(APPLICATION_DATA_KEY, mockExtraData);

        const typeReason = isIllnessReason(session);
        expect(typeReason).to.be.equal(true);
    });

    it('should return false when session is undefined', () => {
        const typeReason = isIllnessReason(undefined);
        expect(typeReason).to.be.equal(false);
    });

    it('should add new permission, mockPathURI, to navigation permission object', () => {
        const mockExtraData = { navigation } as ApplicationData;
        const mockPathURI = 'some/path';

        addPermissionToNavigation(mockExtraData, mockPathURI);
        expect(mockExtraData.navigation.permissions).to.deep.equal([mockPathURI]);
    });

    it('should return illPerson if someoneElse is not selected', () => {
        const illperson = getIllPersonFromIllnessReason(appealIllnessReason.reasons.illness as Illness);
        expect(illperson).to.be.equal('Director');
    });

    it('should return otherPerson if someoneElse selected', () => {
        const illness = {
            ...appealIllnessReason.reasons.illness,
            illPerson: 'someoneElse',
            otherPerson: 'RealName',
        } as Illness;
        const illperson = getIllPersonFromIllnessReason(illness);
        expect(illperson).to.be.equal(illness.otherPerson);
    });

    it('should return correct format date', () => {
        const data = '2020-02-03';
        const dataFormatted = formatDate(data);
        expect(dataFormatted).to.be.equal('3 February 2020');
    });

    it('should return undefined when appeal has got an empty Illness object', () => {
        const session = createSession('secret');
        const mockExtraData = { appeal: { reasons: { illness: {}} } as Appeal } as ApplicationData;

        session.setExtraData(APPLICATION_DATA_KEY, mockExtraData);

        const illnessEndDate = getIllnessEndDate(session);
        expect(illnessEndDate).to.be.equal(undefined);
    });

    it('should return undefined when appeal has got Other type on reason object', () => {
        const session = createSession('secret');
        const mockExtraData = { appeal: { reasons: {} } as Appeal } as ApplicationData;

        session.setExtraData(APPLICATION_DATA_KEY, mockExtraData);

        const illnessEndDate = getIllnessEndDate(session);
        expect(illnessEndDate).to.be.equal(undefined);
    });

    it('should return undefined when appeal has got Other type on reason object', () => {
        const session = createSession('secret');
        const mockExtraData = { appeal: {} as Appeal } as ApplicationData;

        session.setExtraData(APPLICATION_DATA_KEY, mockExtraData);

        const illnessEndDate = getIllnessEndDate(session);
        expect(illnessEndDate).to.be.equal(undefined);
    });

    it('should return true when appeal has got Illness type on reason object', () => {
        const session = createSession('secret');
        const mockExtraData = { appeal: appealIllnessReason as Appeal } as ApplicationData;

        session.setExtraData(APPLICATION_DATA_KEY, mockExtraData);

        const illnessEndDate = getIllnessEndDate(session);
        expect(illnessEndDate).to.be.equal('2020-02-04');
    });

    it('should return undefined when session is undefined', () => {
        const illnessEndDate = getIllnessEndDate(undefined);
        expect(illnessEndDate).to.be.equal(undefined);
    });
});