import * as assert from 'assert';

import { JwtEncryptionService } from 'app/modules/jwt-encryption-service/JwtEncryptionService';


describe('JwtEncryptionService', () => {

    const service: JwtEncryptionService = new JwtEncryptionService();

    it('should generate random nonce value in base64', () => {
        const nonce = service.generateNonce();
        const test = /[A-Za-z0-9+/=]/.test(nonce);
        assert.equal(nonce[nonce.length - 1], '=');
        assert.equal(test, true);
    });

    it('should create an encrypted state and decrypt correctly', async () => {
        const nonce = '2dsa=';
        const content = 'http://example.com';
        const requestKey = 'pXf+qkU6P6SAoY2lKW0FtKMS4PylaNA3pY2sUQxNFDk=';

        const encryptedState= await service.jweEncryptWithNonce(content, nonce, requestKey);
        const decryptedState = await service.jweDecryptWithNonce(encryptedState, requestKey);

        const plainTextState = decryptedState.plaintext.toString();

        assert.equal(plainTextState,`{"nonce":"${nonce}","content":"${content}"}`);
    });
});
