const { executePrettierOnBufferRange } = require("./execute-prettier");
const { getBufferRange } = require("./editor-interface");
const { clearLinterErrors } = require("./linter-interface");
const { isPrettierProperVersion } = require("./helpers");

const format = async (editor) => {
  if (!isPrettierProperVersion(editor)) return;

  clearLinterErrors(editor);

  if (editor.getSelectedText()) {
    for (const bufferRange of editor.getSelectedBufferRanges()) {
      await executePrettierOnBufferRange(editor, bufferRange);
    }
  } else {
    await executePrettierOnBufferRange(editor, getBufferRange(editor));
  }
};

module.exports = format;
