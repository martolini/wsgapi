FROM node:9

RUN mkdir /app

ENV port 8001

ADD package.json /app/package.json

RUN cd /app && yarn

ADD . /app
WORKDIR /app

EXPOSE 8001

HEALTHCHECK CMD curl --fail localhost:8001/health || exit 1

CMD ["yarn", "start"]
