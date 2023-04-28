import { Request } from 'express';

export type Navigation = NavigationControl & NavigationActions;

export type NavigationControl = {
    previous(req: Request): string;
    next(req: Request): string;
    signOut(req: Request): string;
};
export type NavigationActions = {
    actions?: (changeMode: boolean) => { [action: string]: string }
};
