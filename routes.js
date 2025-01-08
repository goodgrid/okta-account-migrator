import express from "express";
import Okta from "./target.js";
import source from "./sources/sources.js"
import { isValidRequest, authenticateRequest, migrateAccounts, logger } from "./utils.js";
import Config from "./config.js";

export const apiRoutes = express.Router();
export const userRoutes = express.Router();

/*
   The server supports one API route, being the HTTP POST towards the /okta-account-migrator. Every other 
   requests results in the default error message by Express.
*/
apiRoutes.post("/verify", express.json(), async (req, res) => {
    if (isValidRequest(req)) {

      const credential = req.body.data.context.credential

      const isUserVerified = await source.methods.authenticateUser(credential.username, credential.password)

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


userRoutes.get("/", authenticateRequest, (req, res) => {
   res.render('index', {
      cspNonce: req.cspNonce
   })
   
})

userRoutes.get("/login", (req, res) => {
   res.render('login', { 
      oktaBaseUrl: Config.target.baseUrl, 
      oidcRedirectUri: Config.target.oidcRedirectUri,
      oidcClientId: Config.target.oidcClientId,
      message: req.query.message,
      cspNonce: req.cspNonce
   })
})

userRoutes.get("/login/callback", async (req, res) => {
   const authorizationCode = req.query.code
   const accessToken = await Okta.auth.getAccessToken(authorizationCode)
   
   req.session.accessToken = accessToken

   res.redirect("/")
})

userRoutes.get("/migrate", authenticateRequest, (req, res) => {
   res.render('migrate', { 
      source: Config.source, 
      target: Config.target,
      cspNonce: req.cspNonce
   });
})


userRoutes.post("/migrate", authenticateRequest, express.urlencoded({ extended: true }), async (req, res) => {
   const batchSize = req.body.batchSize
   const accessToken = req.session.accessToken

   const migrationResults = await migrateAccounts(batchSize, accessToken)

   const download = {
      timestamp: (new Date()).toISOString(),
      file: migrationResults.file
   }

   res.render("confirm", { 
      batchTimestamp: download.timestamp,
      batchSize: batchSize,
      processed: migrationResults.processed, 
      migrated: migrationResults.migrated,
      download: JSON.stringify(download), 
      cspNonce: req.cspNonce
   })
})

userRoutes.post("/download", authenticateRequest, express.urlencoded({ extended: true }), (req, res) => {

   const downloadObject = JSON.parse(req.body.download)

   const file = Buffer.from(downloadObject.file,"base64").toString("utf-8")

   res.setHeader('Content-Length', file.length);
   res.setHeader('Content-Type', 'text/csv');
   res.setHeader('Content-Disposition', `attachment; filename="OAM Results ${downloadObject.timestamp}.csv"`)
   res.write(file, 'binary');

})
