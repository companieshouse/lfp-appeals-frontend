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

To run this app, cd to the root directory, and type the following commands:
- `npm install`
- `npm start`

- Create a redis docker instance with `docker run --name redis-instance -p 6379:6379 -d redis`
- Ensure the variables in `.env` are set according to your setup. For current setup: `REDIS_HOST=127.0.0.1` and `REDIS_PORT=6379`
- If you want a different configuration create `.env.<your-env-name-here>` file with the necessary secrets and variables as described on this README. The `.env` file contains all non-secret variables.
- `npm install`
- `npm start`


Then open your browswer and go to http://localhost:3000.

