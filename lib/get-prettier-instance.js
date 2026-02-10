const bundledPrettier = require("prettier");
const { getCurrentFilePath } = require("./editor-interface");
const { getLocalOrGlobalPrettierPath } = require("./get-prettier-path");
const { log } = require("./log");

const getPrettierInstance = (editor) => {
  const filePath = getCurrentFilePath(editor);
  const prettierPath = getLocalOrGlobalPrettierPath(filePath);
  if (prettierPath) {
    const instance = require(prettierPath);
    log("Prettier instance:", prettierPath, "v" + (instance.version || "unknown"));
    return instance;
  }
  log("Prettier instance: bundled v" + bundledPrettier.version);
  return bundledPrettier;
};

module.exports = getPrettierInstance;
