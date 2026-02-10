const _ = require("lodash/fp");
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
} = require("./atom-interface");
const isFilePathEslintIgnored = require("./eslint-ignored");
const isPrettierInPackageJson = require("./prettier-in-pkg");

const hasFilePath = (editor) => !!getCurrentFilePath(editor);

const filePathDoesNotMatchBlacklistGlobs = _.flow(
  getCurrentFilePath,
  relativizePathFromAtomProject,
  (filePath) => _.negate(someGlobsMatchFilePath)(getExcludedGlobs(), filePath),
);

const noWhitelistGlobsPresent = _.flow(getWhitelistedGlobs, _.isEmpty);

const isFilePathWhitelisted = _.flow(
  getCurrentFilePath,
  relativizePathFromAtomProject,
  (filePath) => someGlobsMatchFilePath(getWhitelistedGlobs(), filePath),
);

const isEslintIgnored = _.flow(getCurrentFilePath, isFilePathEslintIgnored);

const isPrettierConfigPresent = (editor) =>
  _.flow(
    getCurrentFilePath,
    getPrettierInstance(editor).resolveConfig.sync,
    _.negate(_.isNil),
  )(editor);

const shouldFormatOnSave = _.overEvery([
  isFormatOnSaveEnabled,
  hasFilePath,
  _.overSome([
    isFilePathWhitelisted,
    _.overEvery([noWhitelistGlobsPresent, filePathDoesNotMatchBlacklistGlobs]),
  ]),
  _.overSome([_.negate(shouldRespectEslintignore), _.negate(isEslintIgnored)]),
  _.overSome([_.negate(isDisabledIfNotInPackageJson), isPrettierInPackageJson]),
  isPrettierProperVersion,
  _.overSome([_.negate(isDisabledIfNoConfigFile), isPrettierConfigPresent]),
  isFileFormattable,
]);

module.exports = shouldFormatOnSave;
