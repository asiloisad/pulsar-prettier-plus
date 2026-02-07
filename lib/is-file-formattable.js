const _ = require("lodash/fp");
const getPrettierInstance = require("./get-prettier-instance");
const { shouldIgnoreNodeModules } = require("./atom-interface");
const {
  getCurrentFilePath,
  isCurrentFilePathDefined,
} = require("./editor-interface");
const { findCachedFromFilePath } = require("./general");

const getNearestPrettierignorePath = (filePath) =>
  findCachedFromFilePath(filePath, ".prettierignore");

const getPrettierFileInfoForCurrentFilePath = (editor) =>
  getPrettierInstance(editor).getFileInfo.sync(getCurrentFilePath(editor), {
    withNodeModules: !shouldIgnoreNodeModules(),
    ignorePath: getNearestPrettierignorePath(getCurrentFilePath(editor)),
  });

const doesFileInfoIndicateFormattable = (fileInfo) =>
  fileInfo && !fileInfo.ignored && !!fileInfo.inferredParser;

const isFileFormattable = _.overEvery([
  _.negate(_.isNil), // make sure editor is defined just in case there are weird edge cases
  isCurrentFilePathDefined, // make sure filepath is defined for same reason
  _.flow(
    getPrettierFileInfoForCurrentFilePath,
    doesFileInfoIndicateFormattable
  ),
]);

module.exports = isFileFormattable;
