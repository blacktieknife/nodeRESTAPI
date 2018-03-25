const crypto = require('crypto');
const config = require("../config");
module.exports = (str) => {
    if(typeof(str) === "string" && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashSecret).update(str).digest('hex');
        console.log("encrypted password",hash);
        return hash
    } else {
        return false;
    }
}