const _ = require("lodash/fp");
const path = require("path");
const fs = require("fs");
const { findCachedFromFilePath, getDirFromFilePath, someGlobsMatchFilePath } = require("./helpers");

const LINE_SEPERATOR_REGEX = /(\r|\n|\r\n)/;

const getNearestEslintignorePath = (filePath) => findCachedFromFilePath(filePath, ".eslintignore");

const safeRelativePath = _.curry((from, to) =>
  !!from && !!to ? path.join(path.relative(from, to)) : undefined,
);

const getFilePathRelativeToEslintignore = (filePath) =>
  _.flow(getNearestEslintignorePath, getDirFromFilePath, safeRelativePath(_, filePath))(filePath);

const getLinesFromFilePath = (filePath) =>
  !!filePath && filePath.length > 0
    ? fs.readFileSync(filePath, "utf8").split(LINE_SEPERATOR_REGEX)
    : [];

const getIgnoredGlobsFromNearestEslintIgnore = _.flow(
  getNearestEslintignorePath,
  getLinesFromFilePath,
);

const isFilePathEslintignored = _.flow(
  _.over([getIgnoredGlobsFromNearestEslintIgnore, getFilePathRelativeToEslintignore]),
  _.spread(someGlobsMatchFilePath),
);

module.exports = isFilePathEslintignored;
