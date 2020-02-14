const ROOT = '/appeal-a-penalty';
const CATEGORY_PREFIXES = {
    OTHER_REASON: `${ROOT}/other`
};

// Endpoints
export const HEALTH_CHECK_URI = `${ROOT}/healthcheck`;

// Pages
export const LANDING_PAGE_URI = `${ROOT}`;
export const ENTRY_PAGE_URI = `${ROOT}/start`;
export const PENALTY_DETAILS_PAGE_URI = `${ROOT}/penalty-reference`;
export const OTHER_REASON_DISCLAIMER_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/other-reason-entry`;
export const OTHER_REASON_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/reason-other`;
