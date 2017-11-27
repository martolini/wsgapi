FROM node:9-alpine

RUN mkdir /app

ENV port 8001

ADD package.json /app/package.json

RUN cd /app && yarn

ADD . /app
WORKDIR /app

EXPOSE 8001

CMD ["yarn", "start"]
