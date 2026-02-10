const path = require("path");
const { execFileSync } = require("child_process");
const { memoize } = require("lodash");
const { findCached, findCachedFromFilePath } = require("./general");
const { log } = require("./log");

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

const getGlobalPrettierPath = () => {
  const npmPath = getGlobalNpmModulesPath();
  const yarnPath = getGlobalYarnModulesPath();
  const found = findCached(npmPath, PRETTIER_INDEX_PATH) ||
    findCached(yarnPath, PRETTIER_INDEX_PATH);
  if (found) {
    log("Global prettier found:", found);
  } else {
    log("Global prettier not found (npm:", npmPath, "yarn:", yarnPath + ")");
  }
  return found;
};

const getLocalPrettierPath = (filePath) => {
  log("Resolving prettier for:", filePath);
  const found = findCachedFromFilePath(filePath, PRETTIER_INDEX_PATH);
  if (found) {
    log("Local prettier found:", found);
  } else {
    log("Local prettier not found for:", filePath);
  }
  return found;
};

const getLocalOrGlobalPrettierPath = (filePath) => {
  const localPath = getLocalPrettierPath(filePath);
  if (localPath) return localPath;
  log("Trying global prettier...");
  return getGlobalPrettierPath();
};

module.exports = {
  getGlobalPrettierPath,
  getLocalPrettierPath,
  getLocalOrGlobalPrettierPath,
};
