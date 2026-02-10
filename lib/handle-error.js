const _ = require("lodash/fp");
const { getCurrentFilePath } = require("./editor-interface");
const linter = require("./linter-interface");
const { addErrorNotification } = require("./atom-interface");
const { createPoint, createRange } = require("./helpers");

const errorLine = (error) => (error.loc.start ? error.loc.start.line : error.loc.line);

const errorColumn = (error) => (error.loc.start ? error.loc.start.column : error.loc.column);

// NOTE: Prettier error locations are not zero-based (i.e., they start at 1)
const buildPointArrayFromPrettierErrorAndRange = (error, bufferRange) =>
  createPoint(
    errorLine(error) + bufferRange.start.row - 1,
    errorLine(error) === 0
      ? errorColumn(error) + bufferRange.start.column - 1
      : errorColumn(error) - 1,
  );

const buildExcerpt = (error) => _.get("[1]", /(.*)\s\(\d+:\d+\).*/.exec(error.message));

const setErrorMessageInLinter = ({ editor, bufferRange, error }) =>
  linter.setMessages(editor, [
    {
      location: {
        file: getCurrentFilePath(editor),
        position: createRange(
          buildPointArrayFromPrettierErrorAndRange(error, bufferRange),
          buildPointArrayFromPrettierErrorAndRange(error, bufferRange),
        ),
      },
      excerpt: buildExcerpt(error),
      severity: "error",
    },
  ]);

const isSyntaxError = _.overSome([
  _.flow(_.get("error.loc.start.line"), _.isInteger),
  _.flow(_.get("error.loc.line"), _.isInteger),
]);

const isUndefinedError = _.flow(_.get("error.message"), _.matches("undefined"));

const isFilePathPresent = _.flow(_.get("editor"), getCurrentFilePath, _.negate(_.isNil));

const displayErrorInPopup = (args) =>
  console.error(args.error) ||
  addErrorNotification(`prettier-plus failed: ${args.error.message}`, {
    stack: args.error.stack,
    dismissable: true,
  });

const handleError = _.flow(
  _.cond([
    [_.overEvery([isSyntaxError, isFilePathPresent]), setErrorMessageInLinter],
    [isUndefinedError, (args) => console.error("Prettier encountered an error:", args.error)],
    [_.stubTrue, displayErrorInPopup],
  ]),
);

module.exports = handleError;
