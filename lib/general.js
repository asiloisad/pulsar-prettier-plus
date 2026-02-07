const _ = require("lodash/fp");
const { minimatch } = require("minimatch");
const path = require("path");
const fs = require("fs");

const isPresent = (target) =>
  !!target && (typeof target.length === "undefined" || target.length > 0);

const someGlobsMatchFilePath = (globs, filePath) =>
  isPresent(filePath) &&
  globs.some((glob) => minimatch(filePath, glob, { dot: true, matchBase: true }));

const safePathParse = (filePath) =>
  typeof filePath === "string" && filePath.length > 0
    ? path.parse(filePath)
    : undefined;

const getDirFromFilePath = _.flow(safePathParse, _.get("dir"));

// Walk up directories from `dir` looking for `name` (file or relative path).
// Returns the absolute path if found, or undefined.
const findCached = (dir, name) => {
  if (!dir) return undefined;
  const names = Array.isArray(name) ? name : [name];
  let current = path.resolve(dir);
  const { root } = path.parse(current);
  while (true) {
    for (const n of names) {
      const candidate = path.join(current, n);
      try {
        fs.accessSync(candidate);
        return candidate;
      } catch (e) {
        // not found, continue
      }
    }
    const parent = path.dirname(current);
    if (parent === current || current === root) return undefined;
    current = parent;
  }
};

const findCachedFromFilePath = (filePath, name) =>
  _.flow(getDirFromFilePath, (dirPath) =>
    isPresent(dirPath) ? findCached(dirPath, name) : undefined
  )(filePath);

module.exports = {
  isPresent,
  someGlobsMatchFilePath,
  getDirFromFilePath,
  findCached,
  findCachedFromFilePath,
};
