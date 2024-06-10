import config from "./config.js"

export const logger = (message) => {
    console.log(`${new Date().toLocaleString("nl-NL", {
        timeZone: config.timeZone
      })} - ${message}`)
}