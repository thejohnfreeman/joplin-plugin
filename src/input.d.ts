import { FolderEntity } from '../../database/types'

export default class JoplinWorkspace {
    selectedFolder(index: number): Promise<FolderEntity>;
}
