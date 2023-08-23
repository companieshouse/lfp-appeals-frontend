import assert from "assert";
import { expect } from "chai";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { loadEnvironmentVariablesFromFiles } from "app/utils/ConfigLoader";

function withTemporaryProfileFile (profile: string, content: string, fn: () => void): void {
    const envPath = path.join(__dirname, `/../../.env.${profile}`);

    fs.writeFileSync(envPath, content);
    try {
        fn();
        fs.unlinkSync(envPath);
    } catch (error) {
        fs.unlinkSync(envPath);
        throw error;
    }
}

describe("ConfigLoader", () => {
    beforeEach(() => {
        process.env.NODE_ENV = crypto.randomBytes(8).toString("hex");
    });

    it("should load environment variables from existing profile file", () => {
        withTemporaryProfileFile(process.env.NODE_ENV!, "ENABLED=1", () => {
            loadEnvironmentVariablesFromFiles();
            expect(process.env.ENABLED).to.be.equal("1");
        });
    });

    it("should ignore profile file that does not exist", () => {
        try {
            loadEnvironmentVariablesFromFiles();
        } catch (e) {
            assert.fail("Loading profile that does not exist should have succeeded");
        }
    });
});
