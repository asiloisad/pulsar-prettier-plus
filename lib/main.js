const path = require("path");
const { CompositeDisposable, Task } = require("atom");
const {
  createStatusTile,
  updateStatusTile,
  updateStatusTileScope,
  disposeTooltip,
} = require("./status-tile");
const linterInterface = require("./linter-interface");
const format = require("./manual-format");
const formatOnSave = require("./format-on-save");
const displayDebugInfo = require("./display-debug-info");
const { toggleFormatOnSave, shouldIgnoreNodeModules } = require("./atom-interface");
const { getLocalOrGlobalPrettierPath } = require("./get-prettier-path");
const { terminate: terminatePrettierWorker } = require("./prettier-service");

// local helpers
let subscriptions = null;
let statusBarHandler = null;
let statusBarTile = null;
let tileElement = null;
let busySignal = null;

const attachStatusTile = () => {
  if (statusBarHandler) {
    tileElement = createStatusTile();
    statusBarTile = statusBarHandler.addLeftTile({
      item: tileElement,
      priority: 1000,
    });
    updateStatusTile(subscriptions, tileElement);

    subscriptions.add(
      atom.config.observe("prettier-plus.formatOnSaveOptions.enabled", () =>
        updateStatusTile(subscriptions, tileElement),
      ),
    );
    subscriptions.add(
      atom.workspace.onDidChangeActiveTextEditor((editor) =>
        updateStatusTileScope(tileElement, editor),
      ),
    );
  }
};

const detachStatusTile = () => {
  disposeTooltip();
  if (statusBarTile) {
    statusBarTile.destroy();
  }
};

// public API
const activate = () => {
  subscriptions = new CompositeDisposable();
  subscriptions.add(
    atom.commands.add("atom-workspace", "prettier-plus:format", () => {
      const editor = atom.workspace.getActiveTextEditor();
      if (editor) format(editor);
    }),
    atom.commands.add("atom-workspace", {
      "prettier-plus:debug": displayDebugInfo,
      "prettier-plus:toggle": toggleFormatOnSave,
      "prettier-plus:format-project": () => {
        const projectPaths = atom.project.getPaths();
        if (!projectPaths.length) {
          atom.notifications.addInfo("prettier-plus: No open projects.");
          return;
        }

        const ignoreNodeModules = shouldIgnoreNodeModules();
        const projects = projectPaths.map((projectPath) => {
          const syntheticFilePath = path.join(projectPath, "__dummy__");
          const prettierPath = getLocalOrGlobalPrettierPath(syntheticFilePath, projectPath);
          return { projectPath, prettierPath: prettierPath || null };
        });

        const busyMessage = busySignal
          ? busySignal.reportBusy(
              `prettier-plus: Formatting ${projectPaths.length} project(s)...`,
            )
          : null;

        let receivedResults = false;
        const taskPath = path.join(__dirname, "format-project-task.js");
        const task = Task.once(taskPath, projects, ignoreNodeModules, () => {
          if (receivedResults) return;
          if (busyMessage) busyMessage.dispose();
          atom.notifications.addWarning("prettier-plus: Format project failed", {
            dismissable: true,
            detail: "The format task finished without returning results.",
          });
        });

        task.on("prettier-plus:format-progress", ({ projectPath, current, total, filePath }) => {
          if (busyMessage) {
            busyMessage.setTitle(
              `prettier-plus: [${path.basename(projectPath)}] ${current}/${total}: ${path.basename(filePath)}`,
            );
          }
        });

        task.on("prettier-plus:format-done", ({ totalFormatted, totalErrored, errors }) => {
          receivedResults = true;
          if (busyMessage) busyMessage.dispose();

          const summary = `Formatted ${totalFormatted} file(s), errors: ${totalErrored}`;
          if (totalErrored > 0) {
            const errorDetail = errors
              .slice(0, 20)
              .map((e) => `  ${e.filePath}: ${e.message}`)
              .join("\n");
            atom.notifications.addWarning(`prettier-plus: ${summary}`, {
              dismissable: true,
              detail: errorDetail + (errors.length > 20 ? "\n  ... and more" : ""),
            });
          } else {
            atom.notifications.addSuccess(`prettier-plus: ${summary}`, {
              dismissable: true,
            });
          }
        });
      },
    }),
    atom.workspace.observeTextEditors((editor) =>
      subscriptions.add(editor.getBuffer().onWillSave(() => editor && formatOnSave(editor))),
    ),
    atom.config.observe("prettier-plus.formatOnSaveOptions.showInStatusBar", (show) =>
      show ? attachStatusTile() : detachStatusTile(),
    ),
  );
};

const deactivate = () => {
  subscriptions.dispose();
  detachStatusTile();
  terminatePrettierWorker();
};

const consumeStatusBar = (statusBar) => {
  statusBarHandler = statusBar;

  const showInStatusBar = atom.config.get("prettier-plus.formatOnSaveOptions.showInStatusBar");
  if (showInStatusBar) {
    attachStatusTile();
  }
};

const consumeBusySignal = (service) => {
  busySignal = service;
};

const consumeIndie = (registerIndie) => {
  const linter = registerIndie({ name: "Prettier" });
  linterInterface.set(linter);
  subscriptions.add(linter);

  // Setting and clearing messages per filePath
  subscriptions.add(
    atom.workspace.observeTextEditors((textEditor) => {
      const editorPath = textEditor.getPath();
      if (!editorPath) {
        return;
      }

      const subscription = textEditor.onDidDestroy(() => {
        subscriptions.remove(subscription);
        linter.setMessages(editorPath, []);
      });
      subscriptions.add(subscription);
    }),
  );
};

module.exports = {
  activate,
  deactivate,
  subscriptions,
  consumeStatusBar,
  consumeBusySignal,
  consumeIndie,
};
