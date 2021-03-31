import Joplin from './Joplin';
/**
 * @ignore
 */
export default class Global {
    get joplin(): Joplin;
    require(filePath: string): any;
    get process(): any;
}
