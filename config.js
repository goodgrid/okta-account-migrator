import secrets from './secrets.js'

const config = {
    timezone: "Europe/Amsterdam",
    oktaInstances: {
        source: {
            baseUrl: "https://dev-05729419.okta.com/api/v1",
            token: secrets.sourceToken, //This is currently only for creation of test data!!
            allowedStatusses: ["SUCCESS", "MFA_ENROLL"]
        },
        target: {
            baseUrl: "https://dev-4478738.okta.com/api/v1",
            token: secrets.targetToken,
            hookAuthentication: {
                header: "authorization",
                secret: secrets.targetSecret
            }
        }
    }
}
export default config