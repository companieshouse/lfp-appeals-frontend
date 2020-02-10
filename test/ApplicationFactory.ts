import { Container } from 'inversify';
import { Application } from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import { getExpressAppConfig } from '../src/utils/ConfigLoader'

export const createApplication = (configureContainerBindings: (container: Container) => void): Application => {
    const container = new Container();
    configureContainerBindings(container);
    return new InversifyExpressServer(container).setConfig(getExpressAppConfig('../../')).build();
};
