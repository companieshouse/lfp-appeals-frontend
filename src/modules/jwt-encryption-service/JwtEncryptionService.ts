import 'reflect-metadata';

import { randomBytes } from 'crypto';
import { JWE, JWK } from 'node-jose';

export class JwtEncryptionService {

    public generateNonce(): string {
        const bytes = randomBytes(10);
        const buffer = Buffer.from(bytes);
        return buffer.toString('base64');
    }

    public async jweEncryptWithNonce(content: string, nonce: string, requestKey: string): Promise<string> {

        const payload = JSON.stringify({ nonce, content });
        const bufferedKey = Buffer.from(`${requestKey}`, 'base64');

        const ks = await JWK.asKeyStore([{
            alg: 'A128CBC-HS256',
            k: bufferedKey,
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

    public async jweDecryptWithNonce(content: string, requestKey: string): Promise<JWE.DecryptResult> {

        const bufferedKey = Buffer.from(`${requestKey}`, 'base64');

        const ks = await JWK.asKeyStore([{
            alg: 'A128CBC-HS256',
            k: bufferedKey,
            kid: 'key',
            kty: 'oct',
            use: 'enc',
        }]);

        const key = await JWK.asKey(ks.get('key'));

        return await JWE.createDecrypt(key).decrypt(content);
    }
}
