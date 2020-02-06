import { Container } from 'inversify';
import { Application } from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';

export const createApplication = (configureContainerBindings: (container: Container) => void): Application => {
    const container = new Container();
    configureContainerBindings(container);
    return new InversifyExpressServer(container).build();
};
