"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_URI = '/appeal-a-penalty';
const CATEGORY_PREFIXES = {
    OTHER_REASON: `${exports.ROOT_URI}/other`
};
exports.HEALTH_CHECK_URI = `${exports.ROOT_URI}/healthcheck`;
exports.ENTRY_PAGE_URI = `${exports.ROOT_URI}/start`;
exports.PENALTY_DETAILS_PAGE_URI = `${exports.ROOT_URI}/penalty-reference`;
exports.OTHER_REASON_DISCLAIMER_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/other-reason-entry`;
exports.OTHER_REASON_PAGE_URI = `${CATEGORY_PREFIXES.OTHER_REASON}/reason-other`;
