# joplin-plugin

This repository is organized as a [Lerna][] project.

[Lerna]: https://lerna.js.org/


## Workflow

To publish a new version of `joplin-plugin` following a release of Joplin:

1. Clone this repository and bootstrap the packages.

  ```
  npx lerna bootstrap
  ```

1. From within the `extract` package,

  1. Edit the parameters in `src/pipeline.ts`:

    - `ref`: The GitHub reference from which to extract the source files.
        Generally, this can be the tag matching the released version, but
        double-check that `packages/lib/package.json` has the same version.
    - `version`: The version of `joplin-plugin` that will be published. This
        should include a prerelease identifier.

  1. Compile: `yarn build`.
  1. Run: `yarn run`.

1. From within each `example-*` package, test that it can be built with no
   errors: `yarn build`. If there are errors, it could be because the API
   changed. In that case, it may be worth repairing the example to preserve it
   as a useful test going forward. If not, just remove it.

1. Commit the changes.
1. Check that Lerna is aware the `joplin-plugin` package has changed: `npx lerna changed`.
