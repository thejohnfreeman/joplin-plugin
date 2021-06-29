/**
 * @ignore
 *
 * Not sure if it's the best way to hook into the app
 * so for now disable filters.
 */
declare class JoplinFilters {
    on(name: string, callback: Function): Promise<void>;
    off(name: string, callback: Function): Promise<void>;
}
export default JoplinFilters;
