const path = require("path");
const { execFileSync } = require("child_process");
const { memoize } = require("lodash");
const { findCached, findCachedFromFilePath } = require("./general");

const PRETTIER_INDEX_PATH = path.join("node_modules", "prettier", "index.js");

const getGlobalNpmModulesPath = memoize(() => {
  try {
    const prefix = execFileSync("npm", ["get", "prefix"], {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
    if (
      process.platform === "win32" ||
      process.env.OSTYPE === "msys" ||
      process.env.OSTYPE === "cygwin"
    ) {
      return path.resolve(prefix, "node_modules");
    }
    return path.resolve(prefix, "lib/node_modules");
  } catch (e) {
    return "";
  }
});

const getGlobalYarnModulesPath = memoize(() => {
  try {
    return execFileSync("yarn", ["global", "dir"], {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch (e) {
    return "";
  }
});

const getGlobalPrettierPath = () =>
  findCached(getGlobalNpmModulesPath(), PRETTIER_INDEX_PATH) ||
  findCached(getGlobalYarnModulesPath(), PRETTIER_INDEX_PATH);

const getLocalPrettierPath = (filePath) =>
  findCachedFromFilePath(filePath, PRETTIER_INDEX_PATH);

const getLocalOrGlobalPrettierPath = (filePath) =>
  getLocalPrettierPath(filePath) || getGlobalPrettierPath();

module.exports = {
  getGlobalPrettierPath,
  getLocalPrettierPath,
  getLocalOrGlobalPrettierPath,
};
