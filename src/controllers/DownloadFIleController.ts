import { SafeNavigationBaseController } from './SafeNavigationBaseController';

import { Navigation } from 'app/utils/navigation/navigation';
const template = 'download-file'

const navigation: Navigation = {
    next: () => '#',
    previous: () => '#'
}

export class DownloadFileController extends SafeNavigationBaseController<any> {


    constructor() {
        super(template, navigation, undefined, undefined, [])
    }

    protected prepareViewModelFromAppeal(): any {
        throw new Error('Method not implemented.');
    }

}