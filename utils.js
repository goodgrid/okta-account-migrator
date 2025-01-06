import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { stringify } from "csv-stringify/sync"
import Okta from "./target.js"
import source from "./sources/sources.js"
import Config from "./config.js"

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

export const authenticateRequest = (req, res, next) => {

  if (!req.session.accessToken) {
      res.redirect(`/login?origin=${req.url}`)
    }
    next()
}


export const isValidWebToken = async (jwksUri, token) => {
  const decodedHeader = jwt.decode(token, { complete: true });

  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      throw new Error('Invalid token: Missing KID in header.');
  }

  const client = jwksClient({
    jwksUri: jwksUri
  })

  const publicKey = (await client.getSigningKey(decodedHeader.header.kid)).publicKey

  try {
    const result = jwt.verify(token, publicKey, { algorithms: ['RS256'] })

    //if (Config.debug) 
      console.log(`Token for ${result.email} is valid until ${new Date(result.exp * 1000)}`)
    
    return result
  } catch (error) {
    console.error(error.message)
    return null
  }
  
}

export const migrateUsers = async (batchSize, accessToken) => {

  const csvOptions = {
    header: true,
    delimiter: ";"
  }

  /*
    All accounts are retrieved from the backlog. This is a method exposed by the 
    source plugin implementation. The backlog is looped over and for every account
    the account is attempted to be created at the target. 
  */
  const accounts = await source.methods.getBacklog(batchSize)

  console.log(accounts)

  const results = await Promise.all(accounts.map(async account => {

    let migrationStatus = { status: "", data: { errors: "" } }

    if (Config.source.allowedUserStatusses.indexOf(account.status) > -1) {

      console.log(`Migrating user ${account.email} `)

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