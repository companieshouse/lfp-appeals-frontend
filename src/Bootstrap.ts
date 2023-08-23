import * as tsConfigPaths from "tsconfig-paths";

tsConfigPaths.register({
    baseUrl: __dirname,
    paths: require(`${__dirname}/tsconfig.json`).compilerOptions.paths
});
