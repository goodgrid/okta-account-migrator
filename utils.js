import { stringify } from "csv-stringify/sync"
import Okta from "./okta.js"
import config from "./config.js"

export const logger = (message) => {
    console.log(`${new Date().toLocaleString("nl-NL", {
        timeZone: config.timeZone
      })} - ${message}`)
}


/*
   This function determines whether to process the request or ignore it and send an error status. These
   checks are performed:   
   1) Both in the Target Okta and in this app, the name of the http header and the expected value
   can be confifured. These must match for the request to be processed.
   2) Okta sends a hook of a certain type. This app is set up to process hooks of the type 
   "com.okta.user.credential.password.import". Any other type of hook is ignored.
   3) Only hooks originating from the knows Target Okta are processed. Any other is ignored.
*/
export const isValidRequest = (req) => {
   
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

/*
  If no basic authentication headers are present, return a the headers indicating that authentication
  is required. If headers are present, parse them and verify the credentials against the configured
  credentials.

  This is Express middleware called in every route requiring authentication.
*/
export const authenticateRequest = (req, res, next) => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

  if (login && password && login === config.server.username && password === config.server.password) {
    return next()
  }

  res.set('WWW-Authenticate', 'Basic realm="Okta Account Migrator"')
  res.status(401).send('Authentication required.')
}



export const migrateUsers = async (batchSize) => {

  const csvOptions = {
    header: true,
    delimiter: ";"
  }

  const accounts = await Okta.user.list(config.oktaInstances.source, batchSize)
  
  const results = await Promise.all(accounts.map(async account => {
    const migrationStatus = await Okta.user.create(config.oktaInstances.target, account.profile)

    return {
      sourceId: account.id,
      ...account.profile,
      status: migrationStatus.status,
      exceptions: migrationStatus.data.errors,
      targetId: migrationStatus.data.id
    }
  }))
  
  console.log(results)

  return Buffer.from(stringify(results, csvOptions)).toString("base64")
}