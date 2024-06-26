import config from "../config.js";


let source
try {
    source = await import(`./${config.source.plugin}.js`)

    

 } catch (error) {

    console.error(`Unable to load the source IdP plugin. It is expected as 'source/${config.source.plugin}.js`)
    console.error(error.message)
    process.exit()

 }

 export default source