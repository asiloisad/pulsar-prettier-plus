const _ = require("lodash/fp");
const bundledPrettier = require("prettier");
const { getCurrentFilePath } = require("./editor-interface");
const { getLocalOrGlobalPrettierPath } = require("./get-prettier-path");

const requireWithFallbackToBundledPrettier = (prettierPackagePath) =>
  prettierPackagePath ? require(prettierPackagePath) : bundledPrettier;

const getPrettierInstance = _.flow(
  getCurrentFilePath,
  getLocalOrGlobalPrettierPath,
  requireWithFallbackToBundledPrettier
);

module.exports = getPrettierInstance;
