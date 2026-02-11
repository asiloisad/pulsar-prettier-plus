const path = require("path");
const { CompositeDisposable } = require("atom");
const {
  createStatusTile,
  updateStatusTile,
  updateStatusTileScope,
  disposeTooltip,
} = require("./status-tile");
const linterInterface = require("./linter-interface");
const format = require("./manual-format");
const formatOnSave = require("./format-on-save");
const formatProject = require("./format-project");
const displayDebugInfo = require("./display-debug-info");
const toggleFormatOnSave = require("./atom-interface").toggleFormatOnSave;
const { terminate: terminatePrettierWorker } = require("./prettier-service");

// local helpers
let subscriptions = null;
let statusBarHandler = null;
let statusBarTile = null;
let tileElement = null;

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
      "prettier-plus:format-project": async () => {
        const projectPaths = atom.project.getPaths();
        if (!projectPaths.length) {
          atom.notifications.addInfo("prettier-plus: No open projects.");
          return;
        }

        const notification = atom.notifications.addInfo(
          `prettier-plus: Formatting ${projectPaths.length} project(s)...`,
          { dismissable: true, detail: "Starting..." },
        );

        let totalFormatted = 0;
        let totalErrored = 0;
        const allErrors = [];

        for (const projectPath of projectPaths) {
          const projectName = path.basename(projectPath);
          try {
            const results = await formatProject(projectPath, {
              onProgress({ current, total, filePath }) {
                const el = notification.getElement ? notification.getElement() : null;
                const detail = el ? el.querySelector(".detail-content") : null;
                if (detail) {
                  detail.textContent = `[${projectName}] ${current}/${total}: ${path.basename(
                    filePath,
                  )}`;
                }
              },
            });
            totalFormatted += results.formatted;
            totalErrored += results.errored;
            allErrors.push(...results.errors);
          } catch (err) {
            atom.notifications.addError(`prettier-plus: Error formatting "${projectName}"`, {
              dismissable: true,
              detail: err.stack,
            });
          }
        }

        notification.dismiss();

        const summary = `Formatted ${totalFormatted} file(s), errors: ${totalErrored}`;
        if (totalErrored > 0) {
          const errorDetail = allErrors
            .slice(0, 20)
            .map((e) => `  ${e.filePath}: ${e.message}`)
            .join("\n");
          atom.notifications.addWarning(`prettier-plus: ${summary}`, {
            dismissable: true,
            detail: errorDetail + (allErrors.length > 20 ? "\n  ... and more" : ""),
          });
        } else {
          atom.notifications.addSuccess(`prettier-plus: ${summary}`, {
            dismissable: true,
          });
        }
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
  consumeIndie,
};
