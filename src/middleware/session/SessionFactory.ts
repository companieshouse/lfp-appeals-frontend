import * as session from 'express-session';

export const newSessionInstance = () => session({
    secret: 'Something',

});
