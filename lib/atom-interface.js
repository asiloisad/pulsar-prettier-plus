const path = require("path");
const _ = require("lodash/fp");

// constants
const LINTER_LINT_COMMAND = "linter:lint";

// local helpers
const getConfigOption = (key) => atom.config.get(`prettier-plus.${key}`);

const setConfigOption = (key, value) =>
  atom.config.set(`prettier-plus.${key}`, value);

const isLinterLintCommandDefined = (editor) =>
  atom.commands
    .findCommands({ target: atom.views.getView(editor) })
    .some((command) => command.name === LINTER_LINT_COMMAND);

// public
const isFormatOnSaveEnabled = () =>
  getConfigOption("formatOnSaveOptions.enabled");

const isDisabledIfNotInPackageJson = () =>
  getConfigOption("formatOnSaveOptions.isDisabledIfNotInPackageJson");

const isDisabledIfNoConfigFile = () =>
  getConfigOption("formatOnSaveOptions.isDisabledIfNoConfigFile");

const shouldRespectEslintignore = () =>
  getConfigOption("formatOnSaveOptions.respectEslintignore");

const shouldIgnoreNodeModules = () =>
  getConfigOption("formatOnSaveOptions.ignoreNodeModules");

const toggleFormatOnSave = () =>
  setConfigOption("formatOnSaveOptions.enabled", !isFormatOnSaveEnabled());

const getAtomVersion = () => atom.getVersion();

const getPrettierAtomConfig = () => atom.config.get("prettier-plus");

const getWhitelistedGlobs = () =>
  getConfigOption("formatOnSaveOptions.whitelistedGlobs");

const getExcludedGlobs = () =>
  getConfigOption("formatOnSaveOptions.excludedGlobs");

const addTooltip = (element, options) => atom.tooltips.add(element, options);

const addInfoNotification = (message, options) =>
  atom.notifications.addInfo(message, options);

const addErrorNotification = (message, options) =>
  atom.notifications.addError(message, options);

const attemptWithErrorNotification = async (func, ...args) => {
  try {
    await func(...args);
  } catch (e) {
    console.error(e);
    addErrorNotification(e.message, { dismissable: true, stack: e.stack });
  }
};

const runLinter = (editor) =>
  isLinterLintCommandDefined(editor) &&
  atom.commands.dispatch(atom.views.getView(editor), LINTER_LINT_COMMAND);

const invokeAtomRelativizePath = _.flow(
  (filePath) => atom.project.relativizePath(filePath), // NOTE: fat arrow necessary for `this`
  _.get("[1]")
);

const relativizePathToDirname = (filePath) =>
  path.relative(path.dirname(filePath), filePath);

const relativizePathFromAtomProject = _.cond([
  [_.isNil, _.constant(null)],
  [_.flow(invokeAtomRelativizePath, path.isAbsolute), relativizePathToDirname],
  [_.stubTrue, invokeAtomRelativizePath],
]);

module.exports = {
  addErrorNotification,
  addInfoNotification,
  addTooltip,
  getAtomVersion,
  getPrettierAtomConfig,
  getWhitelistedGlobs,
  getExcludedGlobs,
  isDisabledIfNotInPackageJson,
  isDisabledIfNoConfigFile,
  isFormatOnSaveEnabled,
  relativizePathFromAtomProject,
  runLinter,
  shouldIgnoreNodeModules,
  shouldRespectEslintignore,
  toggleFormatOnSave,
  attemptWithErrorNotification,
};
