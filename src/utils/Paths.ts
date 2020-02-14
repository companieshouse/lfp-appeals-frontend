export const ROOT_URI = '/appeal-a-penalty';

const CATEGORY_PREFIXES = {
    OTHER_REASON: `${ROOT_URI}/other`
};

// Endpoints
export const HEALTH_CHECK_URI = `${ROOT_URI}/healthcheck`;

// Pages
export const ENTRY_PAGE_URI = `${ROOT_URI}/start`;
export const PENALTY_DETAILS_PAGE_URI = `${ROOT_URI}/penalty-reference`;
export const OTHER_REASON_DISCLAIMER_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/other-reason-entry`;
export const OTHER_REASON_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/reason-other`;
