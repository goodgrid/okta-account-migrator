import axios from "axios";
import { logger } from './utils.js'

const okta = axios.create()

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
        create: async (oktaInstance, user) => {
            try {
                return await okta.post(`${oktaInstance.baseUrl}/users?activate=true`, {
                    ...user,
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
            } catch(error) {
                logger(`An error occured while creating hooked user`)
                console.error(error.response ? error.response.data : error)
            }
        },
        authenticate: async (oktaInstance, credential) => {
            try {
                const response = await okta.post(`${oktaInstance.baseUrl}/authn`, {
                    username: credential.username,
                    password: credential.password
                })

                if (oktaInstance.allowedStatusses.indexOf(response.data.status) > -1) {
                    return true
                }
                logger(`Verification failed due to account status ${response.data.status}`)
                return false
                
            } catch(error) {
                if (error.response && error.response.status === 401) {
                    /*
                        This is a common outcome and not handles as a error
                    */
                    return false
                } else {
                    logger('Unexpected outcome of authentication')
                    console.error(error)
                }
            }
        }
    }
}

export default Okta