import "reflect-metadata";

import { expect } from "chai";
import type Module from "module";

import { ApplicationFactory } from "app/ApplicationFactory";

describe("nodemon-entry", () => {
    const entryPath = require.resolve("../../src/bin/nodemon-entry");
    const originalCreateInstance = ApplicationFactory.createInstance;
    const originalConsoleLog = console.log;
    // Loading the real controllers index would register every controller globally and affect other tests
    const controllersPath = require.resolve("app/controllers/index");
    const originalControllers = require.cache[controllersPath];

    let createInstanceCalls: number;
    let settings: Record<string, unknown>;
    let listenPort: number | undefined;
    let logged: string[];

    beforeEach(() => {
        createInstanceCalls = 0;
        settings = {};
        listenPort = undefined;
        logged = [];

        const fakeApp = {
            set: (key: string, value: unknown) => { settings[key] = value; },
            listen: (port: number, callback: () => void) => {
                listenPort = port;
                callback();
            }
        };

        ApplicationFactory.createInstance = (() => {
            createInstanceCalls += 1;
            return fakeApp;
        }) as typeof ApplicationFactory.createInstance;
        console.log = (...args: unknown[]) => { logged.push(args.join(" ")); };
        delete require.cache[entryPath];
        require.cache[controllersPath] = { id: controllersPath, filename: controllersPath, loaded: true, exports: {} } as unknown as Module;
    });

    afterEach(() => {
        ApplicationFactory.createInstance = originalCreateInstance;
        console.log = originalConsoleLog;
        delete require.cache[entryPath];
        if (originalControllers) {
            require.cache[controllersPath] = originalControllers;
        } else {
            delete require.cache[controllersPath];
        }
    });

    it("should create the application and set the port to 3000", () => {
        require(entryPath);

        expect(createInstanceCalls).to.equal(1);
        expect(settings.port).to.equal(3000);
    });

    it("should listen on port 3000 and log that the application is ready", () => {
        require(entryPath);

        expect(listenPort).to.equal(3000);
        expect(logged).to.have.lengthOf(1);
        expect(logged[0]).to.contain("Application Ready. Running on port 3000");
    });
});
