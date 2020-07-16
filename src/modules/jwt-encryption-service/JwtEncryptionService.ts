import 'reflect-metadata';

import { randomBytes } from 'crypto';
import { JWE, JWK } from 'node-jose';

import { CompanyAuthConfig } from 'app/models/CompanyAuthConfig';

interface AuthPayload {
    nonce: string;
    content: string;
}

export default class JwtEncryptionService {
    public constructor(private companyAuthConfig: CompanyAuthConfig) {}

    public generateNonce(): string {
        const bytes = randomBytes(5);
        const buffer = Buffer.from(bytes);
        return buffer.toString('base64');
    }

    public async jweEncodeWithNonce(returnUri: string, nonce: string): Promise<string> {
        const payloadObject: AuthPayload = {
            nonce,
            content: returnUri
        };

        const payload = JSON.stringify(payloadObject);
        const decoded = Buffer.from(`${this.companyAuthConfig.accountRequestKey}`, 'base64');

        const ks = await JWK.asKeyStore([{
            alg: 'A128CBC-HS256',
            k: decoded,
            kid: 'key',
            kty: 'oct',
            use: 'enc',
        }]);

        const key = await JWK.asKey(ks.get('key'));

        return await JWE.createEncrypt({
            format: 'compact',
            fields: {
                alg: 'dir',
                enc: 'A128CBC-HS256'
            }
        }, key).update(payload).final();
    }
}
