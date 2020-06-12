import { Penalty } from 'ch-sdk-node/dist/services/lfp';

export type PenaltyRadioButton = {
    value: string,
    text: string,
    label: {
        classes: 'govuk-label--s';
    },
    hint: {
        html: string
    }

};

export type PenaltyDetailsRadioComponent = {
    idPrefix: 'select-penalty',
    name: 'selectPenalty',
    fieldSet: {
        legend:{
            text: 'Select the penalty you want to appeal',
            isPageHeading: true,
            classes: 'govuk-fieldset__legend--xl'
        }
    },
    items: PenaltyRadioButton[]
};

const PenaltyRadioButton = (penalty: Penalty): PenaltyRadioButton => {
    return {
        value: penalty.id,
        text: `Accounts made up to ${penalty.madeUpDate}`,
        label: {
            classes: 'govuk-label--s'
        },
        hint:  {
            html: `These accounts were filed ${penalty.transactionDate}.<br>The late filing penalty is £${penalty.originalAmount}.`
        }
    };
};

export const PenaltyDetailsRadioComponent = (penalties: Penalty[]): PenaltyDetailsRadioComponent => {
    return {
        idPrefix:'select-penalty',
        name: 'selectPenalty',
        fieldSet: {
            legend: {
                text: 'Select the penalty you want to appeal',
                isPageHeading: true,
                classes: 'govuk-fieldset__legend--xl',
            }
        },
        items: penalties.map(PenaltyRadioButton)
    };
};
