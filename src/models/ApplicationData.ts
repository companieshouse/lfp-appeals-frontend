import { Appeal } from 'app/models/Appeal';
import { Navigation } from 'app/models/Navigation';


export const APPEALS_KEY = 'appeals';

export interface ApplicationData {
    appeal: Appeal;
    navigation: Navigation
}
