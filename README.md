# LFP Appeals Frontend
This repo contains the frontend code for the LFP appeals service. It's currenty `WIP`.

## Technologies

- [NodeJS](https://nodejs.org/)
- [expressJS](https://expressjs.com/)
- [NunJucks](https://mozilla.github.io/nunjucks)
- [gulpJS](https://gulpjs.com/)
- [inversify](https://github.com/inversify/)

## Recommendations

We recommend the use of Visual Studio Code for development as it allows the installation of the TSLint and the Nunjucks plugins. These plugins will make linting of TS and Nunjuck much better than mmost code editors.

IntelliJ does not have a Nunjuck plugin

## How to run it

- Create a redis docker instance with `docker run --name redis-instance -p 6379:6379 -d redis`
- Ensure the variables in `.env.local` are set according to your setup.
- `npm install`
- `npm start`
- Then open your browswer and go to http://localhost:3000.

## Config Files:

- `.env.local` is the config file for running the app in a local environment.
- If you want a different configuration create `.env.<NODE_ENV>` file with the necessary secrets and variables as described on this README. Note that the `NODE_ENV` variable has to be set with the same name as the config name pretended.

## Docker support

Pull image from private CH registry by running `docker pull 169942020521.dkr.ecr.eu-west-1.amazonaws.com/local/lfp-appeals-frontend:latest` or run the following steps to build image locally:

1. `export SSH_PRIVATE_KEY_PASSPHRASE='[your SSH key passhprase goes here]'` (optional, set only if SSH key is passphrase protected)
2. `DOCKER_BUILDKIT=0 docker build --build-arg SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" --build-arg SSH_PRIVATE_KEY_PASSPHRASE -t 169942020521.dkr.ecr.eu-west-1.amazonaws.com/local/lfp-appeals-frontend:latest .`
