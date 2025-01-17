FROM node:20.18.1-alpine3.20

RUN apk update &&\ 
    apk add tzdata &&\ 
    apk add openssl &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\
    echo "Europe/Amsterdam" > /etc/timezone &&\
    apk del tzdata && rm -rf /var/cache/apk/*

# Upgrade busybox to solve 
# https://security.snyk.io/vuln/SNYK-ALPINE318-BUSYBOX-6913411
RUN apk upgrade busybox

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

ENTRYPOINT ["./entrypoint.sh"]

EXPOSE 443