## Base build image
FROM node:14-alpine as build-base

RUN apk add --update-cache git python make g++ && rm -rf /var/cache/apk/*
RUN git config --global url."https://github.com/".insteadOf 'ssh://git@github.com/'

WORKDIR /build
COPY package.json package-lock.json ./

## Image with runtime dependencies
FROM build-base as prod-deps-image

RUN npm install --production

## Build image
FROM prod-deps-image as build-image

RUN npm install
COPY . ./
RUN npm run build

FROM node:14-alpine as runtime

WORKDIR /app

COPY --from=prod-deps-image /build/node_modules/ ./node_modules
COPY --from=build-image /build/dist/ ./dist
COPY .env.vagrant ./

EXPOSE 3000
CMD [ "node", "/app/dist/App.js" ]
