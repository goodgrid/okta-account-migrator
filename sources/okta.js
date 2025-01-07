import axios from "axios"
import Bottleneck from "bottleneck"

/*
    This object contains source specific configuration. This source config  is
    included in the general config. 
    
    The baseUrl property is required.
*/

export const Config = {
    baseUrl: process.env.OKTA_SOURCE_BASEURL,               // The base url, including api/v1 of the 
                                                            // Okta target instance
    token: process.env.OKTA_SOURCE_TOKEN,                   // The authentication token for the Okta 
                                                            // source  instance
                                                            // TODO: Implement scoped app authorization
    backlogGroupId: process.env.OKTA_SOURCE_BACKLOG_GROUP,  // The Okta group ID that contains the
                                                            // migration backlog
    allowedUserStatusses: ["ACTIVE"],                       // The account statusses that apply for 
                                                            // migration to the target Okta instance.
    allowedAuthStatusses: ["SUCCESS", "MFA_ENROLL"],        // The account statusses returned by Okta
                                                            // after authenticating the user that
                                                            // result in a positive verification result.
}

const client = axios.create({
    baseURL: Config.baseUrl,
    headers: {
        Authorization: `SSWS ${Config.token}`
    }
})

/*
    This object implements all the publicly expected methods.
*/
export const methods = {
    /*
        This function gets the backlog, limited to ${batchSize} ax maximum. The 
        function must return an array of objects looking like:
        [
            {
                id: "",
                status: "",
                firstName: "",
                lastName: "",
                login: "",
                email: ""
            }
        ]

        TODO: Implement paging
    */
    getBacklog: async (batchSize) => {
        const response = await client.get(`groups/${Config.backlogGroupId}/users?limit=${batchSize}`,{
            headers: {
                "okta-response": "omitCredentials,omitCredentialsLinks, omitTransitioningToStatus"
            }
        })

        return response.data.map(account => {
            return {
                id: account.id,
                status: account.status,
                ...account.profile    
            }
        })
            

    },

    /*
        This functon removed a single account from the backlog. It is called after the account
        was succesfully created in the target
    */
    removeFromBacklog: async (id) => {
        const response = client.delete(`groups/${Config.backlogGroupId}/users/${id}`)
    },


    /*
        This function receives the credentials and verifies them at the source. It returns
        either true of false. Received credentials object should look like:

        {
            username: "",
            password: ""
        }

    */
    authenticateUser: async (username, password) => {
        try {
            const response = await client.post(`/authn`, {
                username: username,
                password: password
            })

            if (Config.allowedAuthStatusses.indexOf(response.data.status) > -1) {
                return true
            }
            logger(`Verification failed due to account status ${response.data.status}`)
            return false
            
        } catch(error) {
            if (error.response && error.response.status === 401) {
                /*
                    This is a common outcome and not handled as a error
                */
                return false
            } else {
                logger('Unexpected outcome of authentication')
                console.error(error)
            }
        }

    }
}

