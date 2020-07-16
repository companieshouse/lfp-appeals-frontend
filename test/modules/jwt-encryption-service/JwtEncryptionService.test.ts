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

    it('should create an encrypted state string using nonce value', async () => {
        const nonce = '2dsa=';
        const requestKey = 'pXf+qkU6P6SAoY2lKW0FtKMS4PylaNA3pY2sUQxNFDk=';
        const state = await service.jweEncryptWithNonce('http://example.com', nonce, requestKey);
        const test = /eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2Iiwia2lkIjoia2V5In0..*/.test(state);
        assert.equal(test, true);
    });
});
