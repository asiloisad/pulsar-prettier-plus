const path = require("path");
const { log } = require("./log");

let dugitePath;
let dugiteExec;

const getDugitePath = () => {
  if (dugitePath) return dugitePath;

  try {
    dugitePath = require.resolve("dugite");
  } catch (e) {
    // Fall back to Pulsar's bundled dugite below.
  }

  if (!dugitePath || !path.isAbsolute(dugitePath)) {
    const loadSettings =
      typeof atom !== "undefined" && atom.getLoadSettings ? atom.getLoadSettings() : null;
    const resourcePath = loadSettings && loadSettings.resourcePath;

    if (resourcePath) {
      dugitePath =
        path.extname(resourcePath) === ".asar"
          ? path.join(`${resourcePath}.unpacked`, "node_modules", "dugite")
          : path.join(resourcePath, "node_modules", "dugite");
    }
  }

  return dugitePath;
};

const execGit = async (args, workingDir) => {
  if (!dugiteExec) {
    const { GitProcess } = require(getDugitePath());
    dugiteExec = GitProcess.exec.bind(GitProcess);
  }

  const result = await dugiteExec(args, workingDir, {
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_OPTIONAL_LOCKS: "0",
    },
  });

  if (result.exitCode !== 0) {
    const error = new Error(
      result.stderr || `git ${args.join(" ")} exited with code ${result.exitCode}`,
    );
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }

  return result;
};

const getRepositoryPathForFile = async (filePath) => {
  if (!filePath) return;

  const fileDir = path.dirname(filePath);
  const { stdout } = await execGit(
    ["-c", "safe.directory=*", "rev-parse", "--show-toplevel"],
    fileDir,
  );
  return stdout.trim();
};

const refreshGitIndexForFiles = async (filePaths) => {
  const filesByRepository = new Map();

  for (const filePath of filePaths) {
    if (!filePath) continue;

    try {
      const repositoryPath = await getRepositoryPathForFile(filePath);
      if (!repositoryPath) continue;

      const relativePath = path.relative(repositoryPath, filePath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) continue;

      if (!filesByRepository.has(repositoryPath)) {
        filesByRepository.set(repositoryPath, new Set());
      }
      filesByRepository.get(repositoryPath).add(relativePath);
    } catch (error) {
      log("Git repository lookup skipped:", filePath, error.message);
    }
  }

  for (const [repositoryPath, relativePaths] of filesByRepository) {
    try {
      await execGit(
        ["-c", "safe.directory=*", "update-index", "--refresh", "--", ...relativePaths],
        repositoryPath,
      );
      log("Refreshed git index metadata:", repositoryPath, relativePaths.size, "file(s)");
    } catch (error) {
      log("Git index metadata refresh skipped:", repositoryPath, error.message);
    }
  }
};

const refreshGitIndexForFile = async (filePath) => {
  try {
    await refreshGitIndexForFiles([filePath]);
  } catch (error) {
    log("Git index metadata refresh skipped:", filePath, error.message);
  }
};

const refreshGitIndexForFileAfterSave = (editor, filePath) => {
  const buffer = editor && editor.getBuffer && editor.getBuffer();
  let subscription;
  let didRefresh = false;

  const refresh = () => {
    if (didRefresh) return;
    didRefresh = true;
    if (subscription) subscription.dispose();
    refreshGitIndexForFile(filePath);
  };

  if (buffer && buffer.onDidSave) {
    subscription = buffer.onDidSave(refresh);
    setTimeout(refresh, 1000);
  } else {
    setTimeout(refresh, 0);
  }
};

module.exports = {
  refreshGitIndexForFile,
  refreshGitIndexForFiles,
  refreshGitIndexForFileAfterSave,
};
