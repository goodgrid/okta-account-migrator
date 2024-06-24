import https from 'https'
import express from "express";
import { apiRoutes, userRoutes } from './routes.js';
import { logger } from "./utils.js";
import config from "./config.js";

const app = express();

app.set('views', 'views');
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use("/api/v1", apiRoutes)
app.use("/", userRoutes)

const serverOptions = {
   key: Buffer.from(config.server.key, 'base64').toString('utf8'),
   cert: Buffer.from(config.server.cert, 'base64').toString('utf8')
}

const server = https.createServer(serverOptions, app)

server.listen(config.server.port, () => logger(`Server is started and listening on port ${config.server.port}.`))