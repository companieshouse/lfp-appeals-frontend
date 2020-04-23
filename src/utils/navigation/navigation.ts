import { Request } from 'express';

export type Navigation = NavigationControl & NavigationActions;

export type NavigationControl = {
    previous(req: Request): string;
    next(req: Request): string;
};
export type NavigationActions = { actions?: (cmMode: '1' | '0') => { [action: string]: string } };
