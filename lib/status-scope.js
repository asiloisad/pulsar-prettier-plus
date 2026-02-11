const { isFileFormattable, isPrettierProperVersion } = require("./helpers");

const updateStatusTileScope = async (element, editor) => {
  if (!editor || !isPrettierProperVersion(editor)) {
    element.dataset.prettierCanFormatFile = "false";
    return;
  }
  const canFormat = await isFileFormattable(editor);
  element.dataset.prettierCanFormatFile = canFormat ? "true" : "false";
};

module.exports = updateStatusTileScope;
