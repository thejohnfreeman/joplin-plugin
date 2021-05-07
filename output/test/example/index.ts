import joplin from '../..'

async function main() {
  return joplin.settings.value(123)
}

main()
