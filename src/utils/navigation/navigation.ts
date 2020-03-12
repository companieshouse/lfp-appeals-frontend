import { Request } from 'express'

export interface Navigation {
    previous(req: Request): string
    next(req: Request): string
}

