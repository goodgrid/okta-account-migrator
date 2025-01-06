import Config from "../config.js";

let source
try {

    source = await import(`./${Config.source.plugin}.js`)

 } catch (error) {

    console.error(`Unable to load the source IdP plugin. It is expected as 'source/${Config.source.plugin}.js`)
    console.error(error.message)
    process.exit()

 }

 export default source