import joplin from '../../output'

async function main() {
  return joplin.settings.value(123)
}

main()
