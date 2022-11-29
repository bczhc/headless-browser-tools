FROM bczhc/puppeteer

COPY / /node/

WORKDIR /node

RUN npm install
