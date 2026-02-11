const path = require("path");

const getBufferRange = (editor) => editor.getBuffer().getRange();

const getCurrentFilePath = (editor) =>
  editor.buffer.file ? editor.buffer.file.getPath() : undefined;

const isCurrentFilePathDefined = (editor) => editor && !!getCurrentFilePath(editor);

const getCurrentDir = (editor) => {
  const filePath = getCurrentFilePath(editor);
  return typeof filePath === "string" ? path.dirname(filePath) : undefined;
};

module.exports = {
  getBufferRange,
  isCurrentFilePathDefined,
  getCurrentFilePath,
  getCurrentDir,
};
