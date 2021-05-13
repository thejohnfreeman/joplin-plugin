import { config, rollupExtraScripts } from 'joplin-plugin/rollup'

import pluginConfig from './plugin.config.json'

const extras = rollupExtraScripts(pluginConfig.extraScripts)

export default [...config, ...extras]
