const config = {
    timezone: "Europe/Amsterdam",                   // The timezone is used to have correct 
                                                    // timestamps in logging
    server: {
        username: process.env.SERVER_USERNAME,      // The username of the migration operator to log
                                                    // onto the web UI 
        password: process.env.SERVER_PASSWORD,      // The password of the migration operator to log
                                                    // onto the web UI 
                                                    // TODO: Compare hashes!
        port: process.env.SERVER_PORT,              // The port on which the express webserver will listen
        cert: process.env.SERVER_CERT,              // The server certificate of the express webserver
        key: process.env.SERVER_KEY                 // The private key with the server certificate
                                                    // TODO: Make HTTPS optional
    },
    source: {
        plugin: "okta",                             // The base name of the plugin implmenting 
                                                    //configuration and methods for the source IdP. 
                                                    //A file name with this base name and the 'js' 
                                                    // extension is expected to exist in the sources 
                                                    // directory of the app.
    },
    target: {
        baseUrl: process.env.OKTA_TARGET_BASEURL,   // The base url, including api/v1 of the Okta target 
                                                    // instance
        token: process.env.OKTA_TARGET_TOKEN,       // The authentication token for the Okta target 
                                                    // instance
                                                    // TODO: Implement scoped app authorization
        hookAuthentication: {
            header: "authorization",                // The target Okta instance sending the hook will 
                                                    // authenticate itself with a secret in this header
            secret: process.env.OKTA_TARGET_SECRET  // The secret with which the Okta target instance will
                                                    // authenticate itself.
        }
    }

}

/*
    The source system for user accounts is modular. The "plugin" thatdefines the source contains
    both configuration and implements the required methods. The configuration is read from the source
    config and added to the overall config object.
*/

config.source = {
    ...config.source,
    ...(await import(`./sources/${config.source.plugin}.js`)).config
}

export default config