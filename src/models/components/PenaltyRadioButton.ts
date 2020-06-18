import { Penalty } from 'ch-sdk-node/dist/services/lfp';

export type PenaltyRadioButton = {
    value: string,
    text: string,
    label: {
        classes: 'govuk-label--s';
    },
    hint: {
        html: string;
    };

};

export function createPenaltyRadioButton(penalty: Penalty): PenaltyRadioButton {
    return {
        value: penalty.id,
        text: `Accounts made up to ${penalty.madeUpDate}`,
        label: {
            classes: 'govuk-label--s'
        },
        hint: {
            html: `These accounts were filed ${penalty.transactionDate}.<br>The late filing penalty is £${penalty.originalAmount}.`
        }
    };
}
