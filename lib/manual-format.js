const _ = require("lodash/fp");
const { executePrettierOnBufferRange } = require("./execute-prettier");
const { getBufferRange } = require("./editor-interface");
const { clearLinterErrors } = require("./linter-interface");
const { isPrettierProperVersion } = require("./helpers");

const hasSelectedText = (editor) => !!editor.getSelectedText();

const formatSelectedBufferRanges = (editor) =>
  editor
    .getSelectedBufferRanges()
    .forEach((bufferRange) =>
      executePrettierOnBufferRange(editor, bufferRange)
    );

const executePrettierOnCurrentBufferRange = (editor) =>
  executePrettierOnBufferRange(editor, getBufferRange(editor));

const format = _.cond([
  [
    isPrettierProperVersion,
    _.flow(
      _.tap(clearLinterErrors),
      _.cond([
        [hasSelectedText, formatSelectedBufferRanges],
        [_.stubTrue, executePrettierOnCurrentBufferRange],
      ])
    ),
  ],
]);

module.exports = format;
