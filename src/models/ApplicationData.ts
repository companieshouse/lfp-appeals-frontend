import { Appeal } from 'app/models/Appeal';
import { Navigation } from 'app/models/Navigation';


export const APPLICATION_DATA_KEY = 'appeals';

export interface ApplicationData {
    appeal: Appeal;
    navigation: Navigation;
    submittedAppeal?: Appeal;
}
