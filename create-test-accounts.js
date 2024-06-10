import Okta from "./okta.js";
import config from "./config.js";


if (process.argv.length < 3) {
    console.log("Provide an email address as firstname.last@domain.com as argument")
} else {

    const login = process.argv[2]

    const user = {
        "profile": {
            "firstName": login.split("@")[0].split(".")[0],
            "lastName": login.split("@")[0].split(".")[1],
            "email": login,
            "login": login,
        }
    }

    const result1 = await Okta.user.create(config.oktaInstances.target, user)
    console.log(result1.data)

    const result2 = await Okta.testdata.createTestUser(config.oktaInstances.source, user, "untMYeEg")
    console.log(result2.data)
}
