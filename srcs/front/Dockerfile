FROM node:alpine

RUN mkdir /front
RUN mkdir /my-app
WORKDIR /front
RUN apk add sudo
WORKDIR /front/my-app
COPY init.sh /front
CMD [ "sh", "../init.sh" ]
