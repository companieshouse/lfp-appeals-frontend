import 'reflect-metadata'
// tslint:disable-next-line: ordered-imports
import { loadEnvironmentVariablesFromFiles } from 'app/utils/ConfigLoader';
loadEnvironmentVariablesFromFiles();

import { Arg } from '@fluffy-spoon/substitute';
import { AnySchema } from '@hapi/joi';
import * as Joi from '@hapi/joi';
import * as assert from 'assert';
import { Maybe, Session } from 'ch-node-session-handler';
import { Request, Response } from 'express';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { Container } from 'inversify';

import { BaseController } from 'app/controllers/BaseController';
import { FormActionProcessor, FormActionProcessorConstructor } from 'app/controllers/processors/FormActionProcessor';
import { FormValidator } from 'app/controllers/validators/FormValidator';

import { createSubstituteOf } from 'test/SubstituteFactory';

const template = 'template';
const navigation = {
    previous(): string {
        return '/previous'
    },
    next(): string {
        return '/next'
    }
};

type ControllerConfig = {
    httpContext: {
        container?: Container
        request?: Partial<Request>
        response: Partial<Response>
    }
    formSchema?: AnySchema
    formSanitizeFn?: (formBody: any) => any
    processor?: FormActionProcessorConstructor
    viewModel?: {}
}

function createTestController(config: ControllerConfig): any {
    // tslint:disable-next-line:new-parens
    return new class extends BaseController<any> {
        constructor() {
            super(template, navigation, config.formSchema ? new FormValidator(config.formSchema) : undefined,
                config.formSanitizeFn, config.processor ? [config.processor] : []);
            // @ts-ignore: ignores the fact that http context is readonly
            this.httpContext = config.httpContext
        }
        protected prepareViewModelFromAppeal(): any {
            return config.viewModel;
        }
    }
}

describe('Base controller', () => {
    const navigationConfig = {
        navigation: {
            back: {
                href: '/previous'
            },
            forward: {
                href: '/next'
            }
        }
    };

    describe('GET handler', () => {
        it('should render view with prepared view model', async () => {
            const response = createSubstituteOf<Response>(substitute => {
                substitute.status(Arg.any()).returns(substitute);
            });
            const viewModel = {
                company: 'XYZ'
            };

            await createTestController({
                httpContext: {
                    request: {
                        query: {},
                        session: Maybe.of(new Session())
                    },
                    response
                },
                viewModel
            }).onGet();

            response.received().status(OK);
            // @ts-ignore
            response.received().render(response, template, {
                ...viewModel,
                ...navigationConfig
            } as any);
        })
    });

    describe('POST handler', () => {
        it('should sanitize form body when sanitise function is provided', async () => {
            const response = createSubstituteOf<Response>(substitute => {
                substitute.status(Arg.any()).returns(substitute);
            });
            const formBody = {
                signature: 'Tooth Fairy'
            };

            await createTestController({
                httpContext: {
                    request: {
                        query: {},
                        body: formBody,
                        session: Maybe.empty()
                    },
                    response
                },
                formSanitizeFn: (data: any) => {
                    data.signature = data.signature.toUpperCase();
                    return data;
                }
            }).onPost();

            assert.equal(formBody.signature, 'TOOTH FAIRY');
        });

        it('should render view with form body and error messages when validation failed', async () => {
            const response = createSubstituteOf<Response>(substitute => {
                substitute.status(Arg.any()).returns(substitute);
            });
            const formBody = {
                signature: ''
            };

            await createTestController({
                httpContext: {
                    request: {
                        query: {},
                        body: formBody,
                        session: Maybe.empty()
                    },
                    response
                },
                formSchema: Joi.object({
                    signature: Joi.string().required()
                }),
            }).onPost();

            response.received().status(UNPROCESSABLE_ENTITY);
            // @ts-ignore
            response.received().render(response, template, Arg.is(arg => {
                return JSON.stringify(arg) === JSON.stringify({
                    ...formBody,
                    validationResult: {
                        errors: [
                            {
                                field: 'signature',
                                text: '"signature" is not allowed to be empty'
                            }
                        ]
                    },
                    ...navigationConfig
                })
            }));
        });

        it('should redirect to next page when no processors are registered', async () => {
            const response = createSubstituteOf<Response>();
            await createTestController({
                httpContext: {
                    request: {
                        query: {},
                        session: Maybe.empty()
                    },
                    response
                }
            }).onPost();

            // @ts-ignore
            response.received().redirect('/next')
        });

        it('should redirect to next page when processing is succeeded', async () => {
            // tslint:disable-next-line:max-classes-per-file
            class HappyProcessor implements FormActionProcessor {
                process(): void | Promise<void> {
                    return Promise.resolve();
                }
            }

            const container = createSubstituteOf<Container>(substitute => {
                substitute.get(HappyProcessor).returns(new HappyProcessor());
            });
            const response = createSubstituteOf<Response>();
            await createTestController({
                httpContext: {
                    container,
                    request: {
                        query: {},
                        session: Maybe.empty()
                    },
                    response
                },
                processor: HappyProcessor,
            }).onPost();

            // @ts-ignore
            response.received().redirect('/next')
        });

        it('should throw error when processing failed', async () => {
            // tslint:disable-next-line:max-classes-per-file
            class SadProcessor implements FormActionProcessor {
                process(): void | Promise<void> {
                    return Promise.reject(new Error(':('));
                }
            }

            const container = createSubstituteOf<Container>(substitute => {
                substitute.get(SadProcessor).returns(new SadProcessor());
            });
            const response = createSubstituteOf<Response>();

            try {
                await createTestController({
                    httpContext: {
                        container,
                        request: {
                            query: {},
                        },
                        response
                    },
                    processor: SadProcessor,
                }).onPost();
                assert.fail('Method should have thrown error')
            } catch (e) {
                assert.equal(e.message, ':(')
            }

            // @ts-ignore
            response.didNotReceive().redirect('/next')
        });
    })
});
