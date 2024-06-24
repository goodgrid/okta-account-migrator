const config = {
    timezone: "Europe/Amsterdam",
    server: {
        username: process.env.SERVER_USERNAME,
        password: process.env.SERVER_PASSWORD,
        port: process.env.SERVER_PORT,
        cert: process.env.SERVER_CERT,
        key: process.env.SERVER_KEY
    },
    oktaInstances: {
        source: {
            baseUrl: process.env.OKTA_SOURCE_BASEURL,
            token: process.env.OKTA_SOURCE_TOKEN,
            allowedAuthStatusses: ["SUCCESS", "MFA_ENROLL"]
        },
        target: {
            baseUrl: process.env.OKTA_TARGET_BASEURL,
            token: process.env.OKTA_TARGET_TOKEN,
            hookAuthentication: {
                header: "authorization",
                secret: process.env.OKTA_TARGET_SECRET
            }
        }
    }
}
export default config