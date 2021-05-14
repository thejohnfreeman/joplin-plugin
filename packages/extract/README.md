# joplin-plugin

This package extracts types from the `joplin` package to the `joplin-plugin`
package.

The extraction method I use is different from the [one][1] Joplin used.
I chose to emit declarations (which removes imports that
don't appear in type signatures), and then replace dangling foreign imports
and remove the `declare` modifier from exported enumerations. Some plugins use
the enumerations, which aren't attached to the global `joplin` object and
don't exist as global objects. If they are exported with the `declare`
modifier (or from a file ending in `.d.ts`), then they are not emitted by the
TypeScript compiler, and thus they aren't bundled by Rollup.

[1]: https://github.com/laurent22/joplin/issues/4643#issuecomment-793567125
