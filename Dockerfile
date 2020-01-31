FROM node:10
# Create app directory
WORKDIR /usr/src/lfp-appeals

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
