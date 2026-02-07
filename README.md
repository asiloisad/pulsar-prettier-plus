# prettier-plus

Pulsar plugin for formatting files using [Prettier](https://prettier.io).

Fork of [prettier-atom](https://github.com/prettier/prettier-atom).

## Features

- **Format on command**: Format the active editor via `prettier-plus:format`.
- **Format on save**: Automatically format files when saving, with fine-grained control over which files to include or exclude.
- **Glob filtering**: Include or exclude files from format-on-save using glob patterns.
- **Respect `.eslintignore`**: Optionally skip files listed in `.eslintignore`.
- **Prettier config support**: Reads `.prettierrc`, `prettier.config.js`, and `package.json` prettier config automatically.
- **Status bar indicator**: Optional status bar tile showing format-on-save state.
- **Linter integration**: Reports Prettier errors via the `linter` service.
- **Lightweight**: Simplified fork with minimal dependencies — no bundled ESLint or Stylelint, no forced packages.

## Installation

To install `prettier-plus` search for [prettier-plus](https://web.pulsar-edit.dev/packages/prettier-plus) in the Install pane of the Pulsar settings or run `ppm install prettier-plus`. Alternatively, you can run `ppm install asiloisad/pulsar-prettier-plus` to install a package directly from the GitHub repository.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback's welcome!
