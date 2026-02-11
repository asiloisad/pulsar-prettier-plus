const {
  getPrettierInstance,
  someGlobsMatchFilePath,
  isFileFormattable,
  isPrettierProperVersion,
} = require("./helpers");
const { getCurrentFilePath } = require("./editor-interface");
const {
  getExcludedGlobs,
  getWhitelistedGlobs,
  isFormatOnSaveEnabled,
  isDisabledIfNotInPackageJson,
  isDisabledIfNoConfigFile,
  relativizePathFromAtomProject,
  shouldRespectEslintignore,
  getProjectRootForFile,
} = require("./atom-interface");
const isFilePathEslintIgnored = require("./eslint-ignored");
const isPrettierInPackageJson = require("./prettier-in-pkg");

const shouldFormatOnSave = async (editor) => {
  if (!isFormatOnSaveEnabled()) return false;

  const filePath = getCurrentFilePath(editor);
  if (!filePath) return false;

  const relativePath = relativizePathFromAtomProject(filePath);

  // Whitelist / blacklist glob checks
  const whitelistedGlobs = getWhitelistedGlobs();
  if (whitelistedGlobs && whitelistedGlobs.length > 0) {
    if (!someGlobsMatchFilePath(whitelistedGlobs, relativePath)) return false;
  } else {
    if (someGlobsMatchFilePath(getExcludedGlobs(), relativePath)) return false;
  }

  // Eslintignore check
  const projectRoot = getProjectRootForFile(filePath);
  if (shouldRespectEslintignore() && isFilePathEslintIgnored(filePath, projectRoot)) return false;

  // Package.json check
  if (isDisabledIfNotInPackageJson() && !isPrettierInPackageJson(editor)) return false;

  // Version check
  if (!isPrettierProperVersion(editor)) return false;

  // Config file check
  if (isDisabledIfNoConfigFile()) {
    const prettier = getPrettierInstance(editor);
    const config = await prettier.resolveConfig(filePath);
    if (config == null) return false;
  }

  // Formattable check
  const formattable = await isFileFormattable(editor);
  return formattable;
};

module.exports = shouldFormatOnSave;
