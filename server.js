import https from 'https'
import crypto from 'crypto'
import express from "express";
import helmet from 'helmet';
import session from 'express-session';
import { apiRoutes, userRoutes } from './routes.js';
import { logger } from "./utils.js";
import Config from "./config.js";


const app = express();

const sessionConfig = {
   secret: crypto.randomBytes(16).toString('hex'), 
   resave: false, 
   saveUninitialized: false, 
   cookie: {
     secure: false, 
     httpOnly: true, 
     maxAge: 60 * 60 * 1000,
   }
 }

app.set('views', 'views');
app.set('view engine', 'pug');

app.use(session(sessionConfig))
app.use(express.static('public'));

app.use(helmet());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: [
      "'self'"
    ],
    scriptSrc: [
      "'self'", 
      "'sha256-0tMVjCXtl3efgfTa0jWWIhsVaaZ+J5/u/Ausvjt5JaI='", 
      "'sha256-V2A0FV2gQK2YWDOy+Zqy6N9iSKkcM3diddqTegLFres='", 
      "'sha256-4gndpcgjVHnzFm3vx3UOHbzVpcGAi3eS/C5nM3aPtEc='"
    ],
    imgSrc: [
      "'self'", 
      "https://global.oktacdn.com/"
    ],
    connectSrc: [
      "'self'", 
      Config.target.baseUrl
    ]
  },
}))
app.use(helmet.hsts({
   maxAge: 31536000, 
   includeSubDomains: true, 
   preload: true,
 }))
app.use(helmet.noSniff());
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.hidePoweredBy());
app.use(helmet.crossOriginEmbedderPolicy({policy: 'credentialless'}));
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-origin' }));
app.use(helmet.permittedCrossDomainPolicies({ policy: 'none' }));

app.use("/api/v1", apiRoutes)
app.use("/", userRoutes)

const serverOptions = {
   key: Buffer.from(Config.server.key, 'base64').toString('utf8'),
   cert: Buffer.from(Config.server.cert, 'base64').toString('utf8')
}

const server = https.createServer(serverOptions, app)

server.listen(Config.server.port, () => {
   logger(`Server is started and listening on port ${Config.server.port}.`)
})