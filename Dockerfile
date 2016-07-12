FROM node:argon

RUN mkdir -p /BIDS
WORKDIR /BIDS

COPY package.json /BIDS/
RUN npm install
RUN npm install -g bower gulp forever knex

ENV NODE_ENV production

COPY . /BIDS
COPY config/production.example.js config/production.js

RUN bower install --allow-root

RUN gulp deploy

EXPOSE 3000
CMD [ "node", "app.js" ]
