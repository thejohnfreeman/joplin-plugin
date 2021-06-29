import { ToolbarButtonLocation } from './types';
type Plugin = any;
/**
 * Allows creating and managing toolbar buttons.
 *
 * [View the demo plugin](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins/register_command)
 */
declare class JoplinViewsToolbarButtons {
    private store;
    private plugin;
    constructor(plugin: Plugin, store: any);
    /**
     * Creates a new toolbar button and associate it with the given command.
     */
    create(id: string, commandName: string, location: ToolbarButtonLocation): Promise<void>;
}
export default JoplinViewsToolbarButtons;
