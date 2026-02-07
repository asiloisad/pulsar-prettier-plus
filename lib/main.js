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
const displayDebugInfo = require("./display-debug-info");
const toggleFormatOnSave = require("./atom-interface").toggleFormatOnSave;

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
        updateStatusTile(subscriptions, tileElement)
      )
    );
    subscriptions.add(
      atom.workspace.onDidChangeActiveTextEditor((editor) =>
        updateStatusTileScope(tileElement, editor)
      )
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
    }),
    atom.workspace.observeTextEditors((editor) =>
      subscriptions.add(
        editor.getBuffer().onWillSave(() => editor && formatOnSave(editor))
      )
    ),
    atom.config.observe(
      "prettier-plus.formatOnSaveOptions.showInStatusBar",
      (show) => (show ? attachStatusTile() : detachStatusTile())
    )
  );
};

const deactivate = () => {
  subscriptions.dispose();
  detachStatusTile();
};

const consumeStatusBar = (statusBar) => {
  statusBarHandler = statusBar;

  const showInStatusBar = atom.config.get(
    "prettier-plus.formatOnSaveOptions.showInStatusBar"
  );
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
    })
  );
};

module.exports = {
  activate,
  deactivate,
  subscriptions,
  consumeStatusBar,
  consumeIndie,
};
