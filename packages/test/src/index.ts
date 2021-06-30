import joplin from '@thejohnfreeman/joplin-plugin'
import { FileSystemItem } from '@thejohnfreeman/joplin-plugin/types'

joplin.plugins.register({
  onStart: async function () {
    console.log(`hello, ${FileSystemItem.File}!`)
  }
})
