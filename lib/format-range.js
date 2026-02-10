const _ = require("lodash/fp");

const { runLinter } = require("./atom-interface");
const { getCurrentFilePath } = require("./editor-interface");
const { getPrettierInstance } = require("./helpers");
const handleError = require("./handle-error");

const getPrettierOptions = (editor) =>
  getPrettierInstance(editor).resolveConfig.sync(getCurrentFilePath(editor));

const formatWithCursor = (editor, text, cursorOffset) =>
  getPrettierInstance(editor).formatWithCursor(text, {
    cursorOffset,
    filepath: getCurrentFilePath(editor),
    ...getPrettierOptions(editor),
  });

const executePrettierOnBufferRange = async (editor, bufferRange, options) => {
  // grab cursor position and file contents
  const currentBuffer = editor.getBuffer();
  const cursorPosition = editor.getCursorBufferPosition();
  const textToTransform = editor.getTextInBufferRange(bufferRange);
  const cursorOffset = currentBuffer.characterIndexForPosition(cursorPosition);
  let results = {
    cursorOffset,
    formatted: textToTransform,
  };

  if (_.isEmpty(textToTransform)) return;

  try {
    results = formatWithCursor(editor, textToTransform, cursorOffset);
  } catch (error) {
    handleError({ editor, bufferRange, error });
    return;
  }

  const isTextUnchanged = results.formatted === textToTransform;
  if (isTextUnchanged) return;

  if (options && options.setTextViaDiff) {
    // we use setTextViaDiff when formatting the entire buffer to improve performance,
    // maintain metadata (bookmarks, folds, etc) and eliminate syntax highlight flickering
    // however, we can't always use it because it replaces all text in the file and sometimes
    // we're only editing a sub-selection of the text in a file
    currentBuffer.setTextViaDiff(results.formatted);
  } else {
    editor.setTextInBufferRange(bufferRange, results.formatted);
  }

  // calculate next cursor position after buffer has been updated with new text
  const nextCursorPosition = currentBuffer.positionForCharacterIndex(results.cursorOffset);

  editor.setCursorBufferPosition(nextCursorPosition);
  runLinter(editor);
};

module.exports = executePrettierOnBufferRange;
