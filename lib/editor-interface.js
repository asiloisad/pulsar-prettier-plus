const path = require("path");

let flow;
const lazyFlow = () => {
  if (!flow) {
    flow = require("lodash/fp/flow");
  }
  return flow;
};

const getBufferRange = (editor) => editor.getBuffer().getRange();

const getCurrentFilePath = (editor) =>
  editor.buffer.file ? editor.buffer.file.getPath() : undefined;

const isCurrentFilePathDefined = (editor) => editor && !!getCurrentFilePath(editor);

const getCurrentDir = (editor) =>
  lazyFlow()(getCurrentFilePath, (maybeFilePath) =>
    typeof maybeFilePath === "string" ? path.dirname(maybeFilePath) : undefined,
  )(editor);

module.exports = {
  getBufferRange,
  isCurrentFilePathDefined,
  getCurrentFilePath,
  getCurrentDir,
};
