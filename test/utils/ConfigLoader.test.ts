import assert from 'assert';
import { expect } from 'chai';
import crypto from 'crypto';
import fs from 'fs';

import { loadEnvironmentVariablesFromFiles } from 'app/utils/ConfigLoader';

function withTemporaryProfileFile(profile: string, content: string, fn: () => void): void {
    const path = `${__dirname}/../../.env.${profile}`;

    fs.writeFileSync(path, content);
    try {
        fn();
        fs.unlinkSync(path);
    } catch (error) {
        fs.unlinkSync(path);
        throw error;
    }
}

describe('ConfigLoader', () => {
    beforeEach(() => {
        process.env.NODE_ENV = crypto.randomBytes(8).toString('hex');
    });

    it('should load environment variables from existing profile file', () => {
        withTemporaryProfileFile(process.env.NODE_ENV!, 'ENABLED=1', () => {
            loadEnvironmentVariablesFromFiles();
            expect(process.env.ENABLED).to.be.equal('1');
        });
    });

    it('should ignore profile file that does not exist', () => {
        try {
            loadEnvironmentVariablesFromFiles();
        } catch (e) {
            assert.fail('Loading profile that does not exist should have succeeded');
        }
    });
});
