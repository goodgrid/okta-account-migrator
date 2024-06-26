import axios from "axios";
import Bottleneck from "bottleneck";
import { logger } from './utils.js'

const limiter = new Bottleneck({
    minTime: 200
});

const okta = axios.create()

okta.interceptors.request.use(async config => {
    await limiter.schedule(() => {
        if (config.debug) console.log("Thottling...")
    })
    return config
})

const Okta = {
    testdata: {
        createTestUser: async (oktaInstance, user, password) => {
            try {
                return await okta.post(`${oktaInstance.baseUrl}/users?activate=true`, {
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
        create: async (oktaInstance, user, onProgress) => {
            try {
                const response =  await okta.post(`${oktaInstance.baseUrl}/users?activate=true`, {
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
                        Authorization: `SSWS ${oktaInstance.token}`
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