const readPkgUp = require("./read-pkg-up");
const { getCurrentDir } = require("./editor-interface");

const isPrettierInPackageJson = (editor) => {
  const cwd = getCurrentDir(editor);
  if (!cwd) return false;
  const result = readPkgUp(cwd);
  const pkg = result.packageJson || {};
  return (
    Object.hasOwn(pkg.dependencies || {}, "prettier") ||
    Object.hasOwn(pkg.devDependencies || {}, "prettier")
  );
};

module.exports = isPrettierInPackageJson;
