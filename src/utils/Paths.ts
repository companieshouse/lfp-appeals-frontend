export const ROOT_URI = '/appeal-a-penalty';

const CATEGORY_PREFIXES = {
    ILLNESS: `${ROOT_URI}/illness`,
    OTHER_REASON: `${ROOT_URI}/other`
};

// Endpoints
export const HEALTH_CHECK_URI = `${ROOT_URI}/healthcheck`;

// Pages
export const ENTRY_PAGE_URI = `${ROOT_URI}/start`;
export const ACCESSIBILITY_STATEMENT_URI = `${ROOT_URI}/accessibility-statement`;
export const PENALTY_DETAILS_PAGE_URI = `${ROOT_URI}/penalty-reference`;
export const SELECT_THE_PENALTY_PAGE_URI = `${ROOT_URI}/select-the-penalty`;
export const REVIEW_PENALTY_PAGE_URI =`${ROOT_URI}/review-penalty`;
export const CHOOSE_REASON_PAGE_URI =`${ROOT_URI}/choose-reason`;

export const ILL_PERSON_PAGE_URI = `${CATEGORY_PREFIXES.ILLNESS}/who-was-ill`;
export const ILLNESS_START_DATE_PAGE_URI = `${CATEGORY_PREFIXES.ILLNESS}/illness-start-date`;
export const CONTINUED_ILLNESS_PAGE_URI = `${CATEGORY_PREFIXES.ILLNESS}/continued-illness`;
export const FURTHER_INFORMATION_PAGE_URI = `${CATEGORY_PREFIXES.ILLNESS}/further-information`;

export const OTHER_REASON_DISCLAIMER_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/other-reason-entry`;
export const OTHER_REASON_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/reason-other`;

export const EVIDENCE_QUESTION_URI = `${ROOT_URI}/evidence`;
export const EVIDENCE_UPLOAD_PAGE_URI = `${ROOT_URI}/evidence-upload`;
export const EVIDENCE_REMOVAL_PAGE_URI = `${ROOT_URI}/remove-document`;
export const CHECK_YOUR_APPEAL_PAGE_URI = `${ROOT_URI}/check-your-answers`;
export const CONFIRMATION_PAGE_URI = `${ROOT_URI}/confirmation`;
export const DOWNLOAD_FILE_PAGE_URI = `${ROOT_URI}/download`;
