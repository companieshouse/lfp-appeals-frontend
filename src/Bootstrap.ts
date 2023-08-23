import * as tsConfigPaths from "tsconfig-paths";

import path from "path";

tsConfigPaths.register({
    baseUrl: __dirname,
    paths: require(path.join(__dirname, `/tsconfig.json`)).compilerOptions.paths
});
