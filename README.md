# LFP Appeals Frontend
This repo contains the frontend code for the LFP appeals service. It's currently `WIP`.

## Technologies

- [NodeJS](https://nodejs.org/)
- [expressJS](https://expressjs.com/)
- [NunJucks](https://mozilla.github.io/nunjucks)
- [gulpJS](https://gulpjs.com/)
- [inversify](https://github.com/inversify/)

## Recommendations

We recommend the use of Visual Studio Code for development as it allows the installation of the TSLint and the Nunjucks plugins. These plugins will make linting of TS and Nunjucks much better than most code editors.

IntelliJ does not have a Nunjucks plugin.

## Build

1. Install dependencies:
   ```
   npm install
   ```

2. To build the project, run:
   ```
   npm run build
   ```
   This should produce JavaScript files in the `dist` folder.

## How to run it locally

1. Ensure [`docker-chs-development`](https://github.com/companieshouse/docker-chs-development) is set up.
2. In the `docker-chs-development` directory, enable the `lfp-appeals` module:
   ```
   ./bin/chs-dev modules enable lfp-appeals
   ```
3. Tilt up:
   ```
   tilt up
   ```

### For Local Development

After following the steps to run locally:

1. Enable the service in development mode:
   ```
   ./bin/chs-dev modules development lfp-appeals-frontend
   ```
   This will clone the https://github.com/companieshouse/lfp-appeals-frontend/ into the repositories directory. Any changes in the code in that repository will be automatically reloaded.

2. Start the services and its dependencies with `tilt up`.

### Configuration

To configure the service locally, edit the environment section of the docker compose file located at `services/modules/lfp-appeals/lfp-appeals-frontend.docker-compose.yaml`.

## Configuration & Deployment to Remote Server

1. **Configuration**: Handled by the `terraform/groups/ecs-service/profiles` directory. Edit the var file for the corresponding environment.

2. **Deployment**: Run the pipelines found at [CI platform](https://ci-platform.companieshouse.gov.uk/teams/team-development/pipelines/lfp-appeals-frontend).

## Testing

To run the unit tests for `lfp-appeals-frontend`, use:

```
npm run test
```

## Docker Support

Pull image from private CH registry by running:
```
docker pull 416670754337.dkr.ecr.eu-west-2.amazonaws.com/lfp-appeals-frontend:latest
```

Or run the following steps to build image locally:

1. `export SSH_PRIVATE_KEY_PASSPHRASE='[your SSH key passphrase goes here]'` (optional, set only if SSH key is passphrase protected)
2. Build the image:
   ```
   DOCKER_BUILDKIT=0 docker build --build-arg SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" --build-arg SSH_PRIVATE_KEY_PASSPHRASE -t 416670754337.dkr.ecr.eu-west-2.amazonaws.com/lfp-appeals-frontend:latest .
   ```

## Endpoints

| Path                                                | Method | Description                                                             |
|-----------------------------------------------------|--------|-------------------------------------------------------------------------|
| *` /appeal-a-penalty/healthcheck `*                 | GET    | Return healthcheck status                                               |
| *` /appeal-a-penalty/start `*                       | GET    | Redirect to /penalty-reference                                          |
| *` /appeal-a-penalty/penalty-reference `*           | GET    | Display penalty details form ( company number and penalty reference )   |
| *` /appeal-a-penalty/penalty-reference `*           | POST   | Save and redirect to select-the-penalty                                 |
| *` /appeal-a-penalty/accessibility-statement `*     | GET    | Display accessibility statement                                         |
| *` /appeal-a-penalty/select-the-penalty `*          | GET    | Display the penalty selection radio buttons                             |
| *` /appeal-a-penalty/select-the-penalty `*          | POST   | Save go to review-penalty                                               |
| *` /appeal-a-penalty/review-penalty `*              | GET    | Display penalty details                                                 |
| *` /appeal-a-penalty/review-penalty `*              | POST   | Review penalty details and continue to choose reason screen             |
| *` /appeal-a-penalty/choose-reason `*               | GET    | Display reason-for-appeal radio buttons                                 |
| *` /appeal-a-penalty/choose-reason `*               | POST   | Save choice and go to who-was-ill screen or other reason screen         |
| *` /appeal-a-penalty/illness/who-was-ill `*         | GET    | Display who-was-ill screen                                              |
| *` /appeal-a-penalty/illness/who-was-ill `*         | POST   | Save who-was-ill choice and go to start date                            |
| *` /appeal-a-penalty/illness/illness-start-date `*  | GET    | Display start date screen                                               |
| *` /appeal-a-penalty/illness/illness-start-date `*  | POST   | Save start date and go to continued illness screen                      |
| *` /appeal-a-penalty/illness/illness-end-date `*    | GET    | Display end date screen                                                 |
| *` /appeal-a-penalty/illness/illness-end-date `*    | POST   | Save end date and go to illness infirmation screen                      |
| *` /appeal-a-penalty/illness/continued-illness `*   | GET    | Display continued illness screen                                        |
| *` /appeal-a-penalty/illness/continued-illness `*   | POST   | Save name and description and go to evidence screen                     |
| *` /appeal-a-penalty/other/other-reason-entry `*    | GET    | Display other-reason screen                                             |
| *` /appeal-a-penalty/other/other-reason-entry `*    | POST   | Review information and continue to reason-other screen                  |
| *` /appeal-a-penalty/other/reason-other `*          | GET    | Display reason details form                                             |
| *` /appeal-a-penalty/other/reason-other `*          | POST   | Save details and go to evidence screen                                  |
| *` /appeal-a-penalty/evidence `*                    | GET    | Display upload evidence choice screen                                   |
| *` /appeal-a-penalty/evidence `*                    | POST   | Save upload choice and go to upload screen or check-your-answers screen |
| *` /appeal-a-penalty/evidence-upload `*             | GET    | Display evidence upload screen                                          |
| *` /appeal-a-penalty/evidence-upload `*             | POST   | Save uploaded file and go to check-your-answers screen                  |
| *` /appeal-a-penalty/remove-document `*             | GET    |                                                                         |
| *` /appeal-a-penalty/remove-document `*             | POST   |                                                                         |
| *` /appeal-a-penalty/check-your-answers `*          | GET    | Display check-your-answers screen                                       |
| *` /appeal-a-penalty/check-your-answers `*          | POST   | Submit appeal and go to confirmation screen                             |
| *` /appeal-a-penalty/confirmation `*                | GET    | Display confirmation of submission                                      |
| *` /appeal-a-penalty/download `*                    | -      |                                                                         |
| *` /appeal-a-penalty/illness/illness-information `* | GET    | Display illness information screen                                      |
| *` /appeal-a-penalty/illness/illness-information `* | POST   | Save information and go to evidence screen                              |
