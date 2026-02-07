const { isFormatOnSaveEnabled } = require("./atom-interface");

const getFormatOnSaveStatus = () =>
  isFormatOnSaveEnabled() ? "enabled" : "disabled";

module.exports = getFormatOnSaveStatus;
