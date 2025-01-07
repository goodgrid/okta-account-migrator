import https from 'https'
import crypto from 'crypto'
import express from "express";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
     secure: true, 
     httpOnly: true, 
     maxAge: 60 * 60 * 1000,
   }
 }

app.set('views', 'views');
app.set('view engine', 'pug');

app.use(session(sessionConfig))
app.use(express.static('public'));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // Set time window to 15 minutes
  max: 100,  // Max 100 requests per time window
  message: 'Requests from your IP address exceed our limits. Set back, chill, and try again in a while.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}))

const cspNonce = `nonce-${crypto.randomBytes(16).toString('base64')}`
app.use((req, res, next) => {
  req.cspNonce = cspNonce
  next();
})

app.use(helmet({
    frameguard: { action: 'deny' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", `'nonce-${cspNonce}'`],
        imgSrc: ["'self'", "https://global.oktacdn.com/"],
        connectSrc: ["'self'", Config.target.baseUrl],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    dnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: 'no-referrer' },
    hidePoweredBy: true,
    crossOriginEmbedderPolicy: { policy: 'credentialless' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    permittedCrossDomainPolicies: { policy: 'none' },
  })
);

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