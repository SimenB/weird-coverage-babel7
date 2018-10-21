const fs = require("fs");

const { transformSync } = require("@babel/core");

const { createReporter } = require("istanbul-api");
const istanbulCoverage = require("istanbul-lib-coverage");
const istanbulSourceMap = require("istanbul-lib-source-maps");
const { createInstrumenter } = require("istanbul-lib-instrument");

const filename = require.resolve("./notRequiredInTestSuite.js");

const fileSource = fs.readFileSync(filename, "utf8");
const sourcemapPath = `${filename}.map`;

try {
  fs.unlinkSync(sourcemapPath);
} catch (ignored) {}

const transformResult = transformSync(fileSource, {
  babelrc: false,
  configFile: false,
  compact: false,
  sourceMaps: "both",
  filename,
  presets: [require.resolve("@babel/preset-flow")]
});

fs.writeFileSync(sourcemapPath, JSON.stringify(transformResult.map));

const coverageMap = istanbulCoverage.createCoverageMap({});
const sourceMapStore = istanbulSourceMap.createSourceMapStore();

const instrumenter = createInstrumenter();
instrumenter.instrumentSync(transformResult.code, filename);

coverageMap.addFileCoverage(instrumenter.fileCoverage);
sourceMapStore.registerURL(filename, sourcemapPath);

const { map, sourceFinder } = sourceMapStore.transformCoverage(coverageMap);

const reporter = createReporter();

reporter.add("text-summary");
reporter.write(map, sourceFinder && { sourceFinder });
