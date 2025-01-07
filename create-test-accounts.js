import Okta from "./okta.js";
import { logger } from "./utils.js";
import Config from "./config.js";


if (process.argv.length < 4) {
    logger("Provide an email address as firstname.last@domain.com as the first argument and a password as the second argument")
} else {

    const login = process.argv[2]
    const password = process.argv[3]


    const user = {
        "profile": {
            "firstName": login.split("@")[0].split(".")[0],
            "lastName": login.split("@")[0].split(".")[1],
            "email": login,
            "login": login,
        }
    }

    try {
        await Okta.testdata.createTestUser(Config.source, user, password)

        logger(`Account ${user.login} created.`)
    
    } catch(error)  {
        console.error(error)
    }
}
