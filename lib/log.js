const PACKAGE_NAME = "prettier-plus";

function log(...args) {
  if (typeof atom !== "undefined" && atom.config.get(`${PACKAGE_NAME}.debug`)) {
    // eslint-disable-next-line no-console
    console.log(`[${PACKAGE_NAME}]`, ...args);
  }
}

module.exports = { log };
