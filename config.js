const config = {
    timezone: "Europe/Amsterdam",                               // The timezone is used to have correct 
                                                                // timestamps in logging
    server: {
        port: process.env.SERVER_PORT,                          // The port on which the express webserver will listen
        cert: process.env.SERVER_CERT,                          // The server certificate of the express webserver
        key: process.env.SERVER_KEY                             // The private key with the server certificate
                                                                // TODO: Make HTTPS optional
    },
    source: {
        plugin: "okta",                                         // The base name of the plugin implmenting 
                                                                //configuration and methods for the source IdP. 
                                                                //A file name with this base name and the 'js' 
                                                                // extension is expected to exist in the sources 
                                                                // directory of the app.
    },
    target: {
        baseUrl: process.env.OKTA_TARGET_BASEURL,               // The base url of the Okta target instance
        oidcRedirectUri: process.env.OKTA_OIDC_REDIRECT_URI,    // The redirect URI ending on /login/callback as 
                                                                // configured in the target Okta instance.
        oidcClientId: process.env.OKTA_OIDC_CLIENT_ID,          // The OIDC client ID as provided when configuring
                                                                // the app definition in the target Okta instance.
        oidcClientSecret: process.env.OKTA_OIDC_CLIENT_SECRET,  // The OIDC client secret as provided after 
                                                                // configuring the app definition in the target Okta 
                                                                // instance.
        hookAuthentication: {
            header: "authorization",                            // The target Okta instance sending the hook will 
                                                                // authenticate itself with a secret in this header
            secret: process.env.OKTA_TARGET_SECRET              // The secret with which the Okta target instance will
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
    ...(await import(`./sources/${config.source.plugin}.js`)).Config
}

export default config