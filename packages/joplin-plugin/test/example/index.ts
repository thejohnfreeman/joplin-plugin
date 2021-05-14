import joplin from '../..'

async function main() {
  return joplin.settings.value('abc')
}

main()
