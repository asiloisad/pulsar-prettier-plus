const path = require("path");
const fs = require("fs");
const bundledPrettier = require("prettier");
const { getLocalOrGlobalPrettierPath } = require("./get-prettier-path");
const { shouldIgnoreNodeModules } = require("./atom-interface");
const { log } = require("./log");

const SKIP_DIRS = new Set([".git", ".hg", ".svn"]);

function getPrettierForProject(projectPath) {
  const syntheticFilePath = path.join(projectPath, "__dummy__");
  const prettierPath = getLocalOrGlobalPrettierPath(syntheticFilePath);
  if (prettierPath) {
    const instance = require(prettierPath);
    log("Project prettier:", projectPath, "→", prettierPath, "v" + (instance.version || "unknown"));
    return instance;
  }
  log("Project prettier:", projectPath, "→ bundled v" + bundledPrettier.version);
  return bundledPrettier;
}

function walkDirectory(dir, fileList, ignoreNodeModules) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (ignoreNodeModules && entry.name === "node_modules") continue;
      walkDirectory(fullPath, fileList, ignoreNodeModules);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
}

function yieldToUI() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function formatProject(projectPath, options = {}) {
  const { onProgress } = options;
  const ignoreNodeModules = shouldIgnoreNodeModules();

  const prettier = getPrettierForProject(projectPath);

  const prettierignorePath = path.join(projectPath, ".prettierignore");
  const ignorePath = fs.existsSync(prettierignorePath)
    ? prettierignorePath
    : undefined;

  log("Walking project:", projectPath, ignorePath ? "(has .prettierignore)" : "(no .prettierignore)");

  const allFiles = [];
  walkDirectory(projectPath, allFiles, ignoreNodeModules);
  log("Files found:", allFiles.length);

  const results = { formatted: 0, skipped: 0, errored: 0, errors: [] };
  const BATCH_SIZE = 5;

  for (let i = 0; i < allFiles.length; i++) {
    if (i % BATCH_SIZE === 0 && i > 0) await yieldToUI();

    const filePath = allFiles[i];

    if (onProgress) {
      onProgress({ current: i + 1, total: allFiles.length, filePath });
    }

    try {
      const fileInfo = prettier.getFileInfo.sync(filePath, {
        withNodeModules: !ignoreNodeModules,
        ignorePath,
      });

      if (!fileInfo.inferredParser || fileInfo.ignored) {
        results.skipped++;
        continue;
      }

      const config = prettier.resolveConfig.sync(filePath) || {};
      const source = fs.readFileSync(filePath, "utf8");
      const formatted = prettier.format(source, { ...config, filepath: filePath });

      if (formatted !== source) {
        fs.writeFileSync(filePath, formatted, "utf8");
        results.formatted++;
        log("Formatted:", filePath);
      } else {
        results.skipped++;
      }
    } catch (e) {
      results.errored++;
      results.errors.push({ filePath, message: e.message });
      log("Error formatting:", filePath, e.message);
    }
  }

  log("Project done:", projectPath, `formatted=${results.formatted} skipped=${results.skipped} errors=${results.errored}`);
  return results;
}

module.exports = formatProject;
