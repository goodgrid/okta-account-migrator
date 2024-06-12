import https from 'https'
import express from "express";
import Okta from "./okta.js";
import { logger } from "./utils.js";
import config from "./config.js";

const app = express();

/*
   The server supports one route, being the HTTP POST towards the /okta-account-migrator. Every other 
   requests results in the default error message by Express.
*/
app.post("/okta-account-migrator", express.json(), async (req, res) => {
    if (isValidRequest(req)) {

      const isUserVerified = await Okta.user.authenticate(config.oktaInstances.source, req.body.data.context.credential)

      logger(`User ${isUserVerified ? "IS" : "IS NOT"} succesfully verified at source`)

      /*
         The expected data structure is returned with 'credential' either 'VERIFIED' or 'UNVERIFIED'.
      */
      res.send({
         "commands":[
            {
               "type":"com.okta.action.update",
               "value":{
                  "credential": isUserVerified ? "VERIFIED" : "UNVERIFIED"
               }
            }
         ]
      })
 
    } else {
      res.send({status: "error"}).status(500)
    }
})

const serverOptions = {
   key: Buffer.from(config.server.key, 'base64').toString('utf8'),
   cert: Buffer.from(config.server.cert, 'base64').toString('utf8')
}

const server = https.createServer(serverOptions, app)

server.listen(config.server.port, () => logger(`Server is started and listening on port ${config.server.port}.`));

/*
   This function determines whether to process the request or ignore it and send an error status. These
   checks are performed:   
   1) Both in the Target Okta and in this app, the name of the http header and the expected value
   can be confifured. These must match for the request to be processed.
   2) Okta sends a hook of a certain type. This app is set up to process hooks of the type 
   "com.okta.user.credential.password.import". Any other type of hook is ignored.
   3) Only hooks originating from the knows Target Okta are processed. Any other is ignored.
*/
const isValidRequest = (req) => {
   
   if (req.headers[config.oktaInstances.target.hookAuthentication.header] !== config.oktaInstances.target.hookAuthentication.secret) {
      logger("Hook received with unagreed shared secret or missing header", config.oktaInstances.target.hookAuthentication.header)
      return false
   }

   if (req.body.eventType !== "com.okta.user.credential.password.import") {
      logger("Hook received of unknown type", req.body.eventType)
      return false
   }

   if (req.body.source.match(`^${config.oktaInstances.target.baseUrl}`) === null) {
      logger("Hook from unknown source received", req.body.source)
      return false
   }
   return true
}