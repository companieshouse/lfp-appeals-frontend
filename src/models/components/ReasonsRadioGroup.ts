import { getEnabledAppealReasons } from 'app/utils/FeatureChecker';

export function createReasonsRadioGroup(): {}[] {
    const enabledReasons = getEnabledAppealReasons();
    const allReasons = [
        { value: 'illness', text: 'Illness and health issues' },
        { value: 'other', text: 'I\'m appealing for another reason' }
    ];

    const filteredReasons = allReasons.filter(reason => {
        return enabledReasons.includes(reason.value);
    });

    return filteredReasons;
}