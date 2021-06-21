# joplin-plugin

[![npm](https://img.shields.io/npm/v/@thejohnfreeman/joplin-plugin.svg)](https://www.npmjs.com/package/@thejohnfreeman/joplin-plugin)

This repository has a few packages managed as Yarn workspaces.
These are the packages:

- [`joplin`](./packages/joplin): The upstream Joplin package, as a Git submodule.
- [`extract`](./packages/extract): A package that uses the TypeScript compiler
    to extract type declarations for the Joplin Plugin API from `joplin`.
    This package has no version because it doesn't matter: it is never
    published.
- [`joplin-plugin`](./packages/joplin-plugin): The only package in this
    collection that is published. It contains type declarations for the Joplin
    Plugin API, and tools for building and packaging Joplin plugins.
- `example-*`: Example Joplin plugins used to test `joplin-plugin`. They
    each have a dependency on `joplin-plugin` specified as a relative path.


## Workflow

To publish a new version of `joplin-plugin` following a release of Joplin:

1. Clone this repository and bootstrap the packages: `yarn install`.
1. From within the `extract` package,
    1. Edit the parameters in `src/pipeline.ts`:
        - `upstreamVersion`: The version of the Joplin source files.
        - `upstreamRef`: The GitHub reference from which to extract the source
            files. Generally, this can be the tag matching `upstreamVersion`,
            but double-check that `packages/lib/package.json` has the same
            version.
        - `downstreamVersion`: The version of `@thejohnfreeman/joplin-plugin`
            that will be published. This should be `upstreamVersion` suffixed
            with a prerelease identifier.
    1. Compile: `yarn build`.
    1. Run: `yarn start`.
1. From within each `example-*` package, test that it can be built with no
   errors: `yarn build`. If there are errors, it could be because the API
   changed. In that case, it may be worth repairing the example to preserve it
   as a useful test going forward. If not, just remove it.
1. From within the `joplin-plugin` package, publish it to NPM: `yarn publish`.
1. Commit, tag, and push the changes.
