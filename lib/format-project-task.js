const path = require("path");
const fs = require("fs");
const { createPrettierService } = require("./prettier-service");

const SKIP_DIRS = new Set([".git", ".hg", ".svn"]);
const BATCH_SIZE = 5;

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

// projects = [{ projectPath, prettierPath }]
module.exports = function (projects, ignoreNodeModules) {
  const done = this.async();

  (async () => {
    let totalFormatted = 0;
    let totalErrored = 0;
    const errors = [];

    for (const { projectPath, prettierPath } of projects) {
      const prettier = createPrettierService(prettierPath || undefined);

      const prettierignorePath = path.join(projectPath, ".prettierignore");
      const ignorePath = fs.existsSync(prettierignorePath) ? prettierignorePath : undefined;

      const allFiles = [];
      walkDirectory(projectPath, allFiles, ignoreNodeModules);

      for (let i = 0; i < allFiles.length; i++) {
        if (i % BATCH_SIZE === 0 && i > 0) await yieldToUI();

        const filePath = allFiles[i];
        emit("prettier-plus:format-progress", {
          projectPath,
          current: i + 1,
          total: allFiles.length,
          filePath,
        });

        try {
          const fileInfo = await prettier.getFileInfo(filePath, {
            withNodeModules: !ignoreNodeModules,
            ignorePath,
          });

          if (!fileInfo.inferredParser || fileInfo.ignored) continue;

          const config = (await prettier.resolveConfig(filePath)) || {};
          const source = fs.readFileSync(filePath, "utf8");
          const formatted = await prettier.format(source, { ...config, filepath: filePath });

          if (formatted !== source) {
            fs.writeFileSync(filePath, formatted, "utf8");
            totalFormatted++;
          }
        } catch (e) {
          totalErrored++;
          errors.push({ filePath, message: e.message });
        }
      }
    }

    emit("prettier-plus:format-done", { totalFormatted, totalErrored, errors });
  })()
    .catch((error) => {
      emit("prettier-plus:format-done", {
        totalFormatted: 0,
        totalErrored: 0,
        errors: [{ filePath: "", message: String(error.message || error) }],
      });
    })
    .then(done);
};
