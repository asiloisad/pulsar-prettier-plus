const _ = require("lodash/fp");
const { clearLinterErrors } = require("./linter-interface");
const { getBufferRange } = require("./editor-interface");
const { executePrettierOnBufferRange } = require("./execute-prettier");
const { attemptWithErrorNotification } = require("./atom-interface");
const shouldFormatOnSave = require("./should-save");

const executePrettier = (editor) =>
  executePrettierOnBufferRange(editor, getBufferRange(editor), {
    setTextViaDiff: true,
  });

const formatOnSaveIfAppropriate = _.flow(
  _.tap(clearLinterErrors),
  _.cond([[shouldFormatOnSave, executePrettier]])
);

const safeFormatOnSaveIfAppropriate = (editor) =>
  attemptWithErrorNotification(() => formatOnSaveIfAppropriate(editor));

module.exports = safeFormatOnSaveIfAppropriate;
