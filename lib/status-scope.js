const { isFileFormattable, isPrettierProperVersion } = require("./helpers");

const updateStatusTileScope = (element, editor) => {
  // The editor can be undefined if there is no active editor (e.g. closed all tabs).
  element.dataset.prettierCanFormatFile =
    editor && isPrettierProperVersion(editor) && isFileFormattable(editor) ? "true" : "false";
};

module.exports = updateStatusTileScope;
