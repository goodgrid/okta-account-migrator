const config = {
    timezone: "Europe/Amsterdam",
    oktaInstances: {
        source: {
            baseUrl: process.env.OKTA_SOURCE_BASEURL,
            token: process.env.OKTA_SOURCE_TOKEN,
            allowedStatusses: ["SUCCESS", "MFA_ENROLL"]
        },
        target: {
            baseUrl: process.env.OKTA_SOURCE_BASEURL,
            token: process.env.OKTA_TARGET_TOKEN,
            hookAuthentication: {
                header: "authorization",
                secret: process.env.OKTA_TARGET_SECRET
            }
        }
    }
}
export default config