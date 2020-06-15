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

export type PenaltyDetailsRadioComponent = {
    idPrefix: string,
    name: string,
    fieldset: {
        legend: {
            text: string,
            isPageHeading: true,
            classes: string;
        };
    },
    errorMessage: {
        text: string;
    } | undefined,
    items: PenaltyRadioButton[];
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
