const _ = require("lodash/fp");
const readPkgUp = require("./read-pkg-up");
const { getCurrentDir } = require("./editor-interface");

const hasPackageDependency = (packageName) =>
  _.flow(_.get("packageJson.dependencies"), _.has(packageName));

const hasPackageDevDependency = (packageName) =>
  _.flow(_.get("packageJson.devDependencies"), _.has(packageName));

const hasPackage = (packageName) =>
  _.overSome([hasPackageDependency(packageName), hasPackageDevDependency(packageName)]);

const readContentsOfNearestPackageJson = _.flow(getCurrentDir, (cwd) =>
  cwd ? readPkgUp(cwd) : {},
);

module.exports = _.flow(readContentsOfNearestPackageJson, hasPackage("prettier"));
