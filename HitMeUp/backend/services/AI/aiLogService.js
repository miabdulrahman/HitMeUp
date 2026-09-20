const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
 AIActivityLog = require("../../models/AIActivityLog");

const logAIActivity = async ({
    feature,
    userId = null,
    input,
    output,
    status = "success",
    errorMessage = null,
}) => {
    try{
        const log = await AIActivityLog.create({
            feature,
            userId,
            input,
            output,
            status,
            errorMessage,
        })

        console.log(`AI activity logged: ${feature}`);
        return log;
    }catch (error){
        console.error(`AI Log service Error: `, error);
        return null;
    }
}
module.exports = {
    logAIActivity,
}