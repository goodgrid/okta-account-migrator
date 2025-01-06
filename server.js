import https from 'https'
import crypto from 'crypto'
import express from "express";
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