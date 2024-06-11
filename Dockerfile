FROM node:20-alpine3.18

RUN apk update &&\ 
    apk add tzdata &&\ 
    apk add openssl &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\
    echo "Europe/Amsterdam" > /etc/timezone &&\
    apk del tzdata && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

ENTRYPOINT ["./entrypoint.sh"]