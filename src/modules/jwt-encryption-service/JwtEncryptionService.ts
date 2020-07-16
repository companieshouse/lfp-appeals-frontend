import 'reflect-metadata';

import { randomBytes } from 'crypto';
import { JWE, JWK } from 'node-jose';

interface AuthPayload {
    nonce: string;
    content: string;
}

export class JwtEncryptionService {

    public generateNonce(): string {
        const bytes = randomBytes(5);
        const buffer = Buffer.from(bytes);
        return buffer.toString('base64');
    }

    public async jweEncryptWithNonce(content: string, nonce: string, requestKey: string): Promise<string> {
        const payloadObject: AuthPayload = {
            nonce,
            content
        };

        const payload = JSON.stringify(payloadObject);
        const decoded = Buffer.from(`${requestKey}`, 'base64');

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
