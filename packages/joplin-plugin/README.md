# @thejohnfreema/joplin-plugin

Types and tools for writing [Joplin][] plugins.

[Joplin]: https://joplinapp.org/


## Versioning

This package is versioned after the version of Joplin from which it was
extracted.
In case multiple versions of this package must be published for a single
version of Joplin, I attach a subversion to every release.
In order for [semantic versioning][semver] to choose the latest subversion, I
specify it as a pre-release identifier, and I never publish a version without
a pre-release identifier.
For the pre-release identifier format, I chose to use a single number starting
at 0 and incrementing with each release.
I anticipate releasing only one version of this package for most versions of
Joplin, and thus most versions of this package will look like `1.2.3-0`.

[semver]: https://semver.org/


## How to start a new plugin

- Add a dependency on `joplin-plugin`
- Add a `build` script that is `joplin-plugin-build && joplin-plugin-pack`.
- Write your TypeScript source at `src/index.ts`.
- Import the Joplin object with `import joplin from '@thejohnfreeman/joplin-plugin'`.
- Import Joplin types with `import { NamedType } from '@thejohnfreeman/joplin-plugin/types'`.


## How to convert an existing plugin

In the filesystem:

- Remove `GENERATOR_DOC.md`, `webpack.config.json`, and the directory `api`.
- Remove `plugin.config.json` if it is simply `{extraScripts: []}`, or if the
    only `extraScripts` are `.js` files.
- You can likely remove `tsconfig.json`.

In `package.json`:

- Remove dependencies on `copy-webpack-plugin`, `fs-extra`, `glob`,
    `on-build-webpack`, `tar`, `ts-loader`, `webpack`, `webpack-cli`,
    `chalk`, and `yargs`.
- Add a dependency on `@thejohnfreeman/joplin-plugin`.
- Remove scripts for `dist`, `prepare`, and `update`.
- Add a `build` script that is `joplin-plugin-build && joplin-plugin-pack`.

In your TypeScript source code:

- Replace all imports of the `api` module with imports of the
    `@thejohnfreeman/joplin-plugin` module.


## Notes

This package includes NodeJS ES module "exports" that point to TypeScript
sources just to quiet warnings from the plugin `@rollup/plugin-node-resolve`.

This package uses the `typeVersions` field to simulate submodule exports for
TypeScript.
