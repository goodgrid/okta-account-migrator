import fs from 'fs'
import express from "express";
import Okta from "./target.js";
import { isValidRequest, authenticateRequest, migrateUsers, logger } from "./utils.js";
import config from "./config.js";

export const apiRoutes = express.Router();
export const userRoutes = express.Router();

/*
   The server supports one API route, being the HTTP POST towards the /okta-account-migrator. Every other 
   requests results in the default error message by Express.
*/
apiRoutes.post("/verify", express.json(), async (req, res) => {
    if (isValidRequest(req)) {

      const credential = req.body.data.context.credential

      const isUserVerified = await Okta.user.authenticate(config.source, credential.username, credential.password)

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


const contacts = []

userRoutes.get("/", authenticateRequest, (req, res) => {
   res.render('index');
})

userRoutes.get("/migrate", authenticateRequest, (req, res) => {
   const re = /https:\/\/(.*?)\//
   const servers = {
      source: (config.source.baseUrl.match(re) || [])[1],
      target: (config.target.baseUrl.match(re) || [])[1]
   }

   res.render('migrate', { source: config.source, target: config.target });
})


userRoutes.post("/migrate", authenticateRequest, express.urlencoded({ extended: true }), async (req, res) => {
   const batchSize = req.body.batchSize

   const migrationResults = await migrateUsers(batchSize)

   const download = {
      timestamp: (new Date()).toISOString(),
      file: migrationResults.file

   }

   res.render('content', (err) => {
      const html = `
         <main id="content" hx-swap-oob="afterbegin">
            <p class="flash">
               Batch of ${batchSize} accounts resulted in ${migrationResults.processed} users processed and ${migrationResults.migrated} users succesfully migrated. Click 'Download' to download batch details.
            </p>            
         </main>

         <form action="/download" method="post">
            <input name="download" type="hidden" value='${JSON.stringify(download)}'/>
            <button type="submit">Download</button>
         </form>
         `
         
      res.send(html);
   });
})

userRoutes.post("/download", authenticateRequest, express.urlencoded({ extended: true }), (req, res) => {

   const file = Buffer.from(JSON.parse(req.body.download).file,"base64").toString("utf-8")

   res.setHeader('Content-Length', file.length);
   res.setHeader('Content-Type', 'text/csv');
   res.write(file, 'binary');

})
