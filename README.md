# joplin-plugin

This package constructs the `joplin-plugin` package that sits in the
[`output`](./output) directory.

That package contains:

- Type declarations for the public Joplin Plugin API.
- Two executables, `joplin-plugin-build` and `joplin-plugin-pack`, for
    compiling and packaging a Joplin plugin.

The process by which this package generates that package is thus:

- You edit the Git tag and version number in
    [`pipeline.ts`](./src/pipeline.ts).
- It updates the submodule at [`joplin`](./joplin) to that tag.
- It [extracts][1] the public API from
  [`joplin/packages/lib/services/plugins/api`][] to [`output/src/api`][].
  The essential method is to emit declarations (which removes imports that
  don't appear in type signatures), and then replace dangling foreign imports
  and remove the `declare` modifier from exported enumerations.

[1]: https://github.com/laurent22/joplin/issues/4643#issuecomment-793567125
