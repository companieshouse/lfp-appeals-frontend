import { expect } from "chai";

import { JwtEncryptionService } from "app/modules/jwt-encryption-service/JwtEncryptionService";

describe("JwtEncryptionService", () => {

    const service: JwtEncryptionService = new JwtEncryptionService();

    it("should generate random nonce value in base64", () => {
        const nonce1 = service.generateNonce();
        const nonce2 = service.generateNonce();

        const formatRegex = /[A-Za-z0-9+/=]/;

        expect(nonce1).to.not.equal(nonce2);
        expect(nonce1).to.match(formatRegex);
        expect(nonce2).to.match(formatRegex);
    });

    it("should create an encrypted state and decrypt correctly", async () => {
        const nonce = "2dsa=";
        const content = "http://example.com";
        const requestKey = `${"a".repeat(3)}+${"a".repeat(39)}=`;

        const encryptedState = await service.encrypt({ content, nonce }, requestKey);
        const decryptedState = await service.decrypt(encryptedState, requestKey);

        const plainTextState = decryptedState.plaintext.toString();

        expect(plainTextState).to.equal(`{"content":"${content}","nonce":"${nonce}"}`);
    });
});
