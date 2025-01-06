import axios from "axios";
import Bottleneck from "bottleneck";
import { logger, isValidWebToken } from './utils.js'
import Config from "./config.js";

const limiter = new Bottleneck({
    minTime: 200
});

const okta = axios.create()

okta.interceptors.request.use(async config => {
    await limiter.schedule(() => {
        if (Config.debug) console.log("Thottling...")
    })
    return config
})

const Okta = {
    admin: {
        getAccessToken: async (authorizationCode) => {
            try {
                const params = new URLSearchParams({
                    grant_type: "authorization_code",
                    code: authorizationCode,
                    redirect_uri: Config.target.oidcRedirectUri,
                    client_id: Config.target.oidcClientId,
                    client_secret: Config.target.oidcClientSecret
                })

                const config = {
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }

                const response = await okta.post(`${Config.target.baseUrl}/oauth2/v1/token`, params, config)

                return response.data.access_token
    
            } catch(error) {
                console.log(error.response.data)
            }
        }
    },
    testdata: {
        createTestUser: async (oktaInstance, user, password) => {
            try {
                return await okta.post(`${oktaInstance.baseUrl}/api/v1/users?activate=true`, {
                    ...user,
                    credentials: {
                        password : {
                            value: password
                        }
                    }
                }, {
                    headers: {
                        Authorization: `SSWS ${oktaInstance.token}`
                    }
                })
            } catch(error) {
                logger(`An error occured while creating test user`)
                console.error(error.response ? error.response.data : error)
            }
        }
    },
    user: {
        create: async (oktaInstance, accessToken, user, onProgress) => {
            try {
                const response =  await okta.post(`${oktaInstance.baseUrl}/api/v1/users?activate=true`, {
                    profile: user,
                    credentials: {
                        password : {
                            hook: {
                                type: "default"
                            }
                        }
                    }
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })                  
                return {
                    status: "CREATED",
                    data: {
                        id: response.data.id
                    }
                }
            } catch(error) {
                logger(`An exception occured while creating hooked user`)
                console.error(error.response ? error.response.data : error)

                return {
                    status: "NOT_CREATED",
                    data: {
                        errors: error.response.data.errorCauses.map(cause => cause.errorSummary).join(", ")
                    }
                }
            }
        },
    }
}

export default Okta