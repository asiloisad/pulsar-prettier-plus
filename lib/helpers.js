const getPrettierInstance = require("./get-prettier-instance");
const general = require("./general");
const atomRelated = require("./atom-related");
const isFileFormattable = require("./is-file-formattable");
const isPrettierProperVersion = require("./prettier-version");

module.exports = {
  ...general,
  ...atomRelated,
  getPrettierInstance,
  isPrettierProperVersion,
  isFileFormattable,
};
