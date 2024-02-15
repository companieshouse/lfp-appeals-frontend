import { Session } from "@companieshouse/node-session-handler";
import { expect } from "chai";
import { createSession } from "../session/SessionFactory";

import { getAccessToken } from "app/utils/session/session";

describe("SessionUtils test suite", () => {
    it("call getAccessToken() should return access_token", () => {
        const testSessionRequest: Session = createSession("secret");
        const signInInfo = getAccessToken(testSessionRequest);
        expect(signInInfo).equal(testSessionRequest.data.signin_info?.access_token?.access_token);
    });
    it("call getAccessToken() should throw Session Expected but was undefined", () => {
        try {
            getAccessToken(undefined as unknown as Session);
        } catch (err: any) {
            expect(err.message).to.contain("Session Expected but was undefined");
        }
    });
    it("call getAccessToken() should throw Access token missing from session", () => {
        try {
            getAccessToken({ data: {} } as Session);
        } catch (err: any) {
            expect(err.message).to.contain("Access token missing from session");
        }
    });
});
