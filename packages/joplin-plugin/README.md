# joplin-plugin

Types and tools for writing [Joplin][] plugins.

[Joplin]: https://joplinapp.org/


## How to start a new plugin

- Add a dependency on `joplin-plugin`
- Add a `build` script that is `joplin-plugin-build && joplin-plugin-pack`.
- Write your TypeScript source at `src/index.ts`.
- Import the Joplin Plugin API with `import ... from 'joplin-plugin/...'`.


## How to convert an existing plugin

In the filesystem:

- Remove `GENERATOR_DOC.md`, `webpack.config.json`, and the directory `api`.
- Remove `plugin.config.json` if it is simply `{extraScripts: []}` (or less).

In `package.json`:

- Remove dependencies on `copy-webpack-plugin`, `fs-extra`, `glob`,
    `on-build-webpack`, `tar`, `ts-loader`, `webpack`, `webpack-cli`, `chalk`,
    and `yargs`.
- Add a dependency on `joplin-plugin`.
- Remove scripts for `dist`, `prepare`, and `update`.
- Add a `build` script that is `joplin-plugin-build && joplin-plugin-pack`.

In your TypeScript source code:

- Replace all instances of `import ... from 'api/...'` with `import ... from
    'joplin-plugin/...'`.


## Notes

This package includes NodeJS ES module "exports" that point to TypeScript
sources just to quiet warnings from the plugin `@rollup/plugin-node-resolve`.

This package uses the `typeVersions` field to simulate submodule exports for
TypeScript.
