import { stringify } from "csv-stringify/sync"
import Okta from "./target.js"
import source from "./sources/sources.js"
import Config from "./config.js"

/*
  This function logs to the console. Potential improvement is to make logging 
  modular using - for example - Winston
*/
export const logger = (message) => {
  console.log(`${new Date().toLocaleString("nl-NL", {
    timeZone: Config.timeZone
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
  
  if (req.headers[Config.target.hookAuthentication.header] !== Config.target.hookAuthentication.secret) {
    logger("Hook received with unagreed shared secret or missing header", Config.target.hookAuthentication.header)
    return false
  }

  if (req.body.eventType !== "com.okta.user.credential.password.import") {
    logger("Hook received of unknown type", req.body.eventType)
    return false
  }

  if (req.body.source.match(`^${Config.target.baseUrl}`) === null) {
    logger("Hook from unknown source received", req.body.source)
    return false
  }
  return true
}

/*
  If there is no access token for the session, the user has not authenticated yet. The user is redirected
  to the logon page without special message. If there is a access token it is inspected at the IdP. If the 
  token is not active, the user is redirected to the login page with the message that the session expired.
*/
export const authenticateRequest = async (req, res, next) => {
  const accessToken = req.session.accessToken

  if (!accessToken) {
    res.redirect(`/login?origin=${req.url}`)
  } else if (!(await Okta.auth.validateAccessToken(req.session.accessToken)).isValid) {
    res.redirect(`/login?origin=${req.url}&message=Your session is no longer valid`)
  } else {
    next()
  }
}

/*
  This function migrated the account from source to target using the methods
  implemented in the source plugin and the Okta API for the source.

  All accounts are retrieved from the backlog. This is a method exposed by the 
  source plugin implementation. The backlog is looped over and for every account
  the account is attempted to be created at the target. 
*/
export const migrateAccounts = async (batchSize, accessToken) => {

  const csvOptions = {
    header: true,
    delimiter: ";"
  }

  const accounts = await source.methods.getBacklog(batchSize)

  const results = await Promise.all(accounts.map(async account => {

    let migrationStatus = { status: "", data: { errors: "" } }

    if (Config.source.allowedUserStatusses.indexOf(account.status) > -1) {

      migrationStatus = await Okta.user.create(Config.target, accessToken, {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        login: account.login
      })
    } else {
      migrationStatus = {
        status: "NOT_CREATED",
        data: {
          errors: `Account status '${account.status}' is not migratable`
        }
      }
    }

    if (migrationStatus.status == "CREATED") {
      source.methods.removeFromBacklog(account.id)
    }

    return {
      ...account,
      status: migrationStatus.status,
      exceptions: migrationStatus.data.errors,
      targetId: migrationStatus.data.id
    }
  }))
  return {
    processed: results.length,
    migrated: results.filter(result => result.status === "CREATED").length,
    file: Buffer.from(stringify(results, csvOptions)).toString("base64")
  }
}