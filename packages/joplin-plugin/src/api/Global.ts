type Plugin = any;
import Joplin from './Joplin';
/**
 * @ignore
 */
/**
 * @ignore
 */
declare class Global {
    private joplin_;
    constructor(implementation: any, plugin: Plugin, store: any);
    get joplin(): Joplin;
    get process(): any;
}
export default Global;
