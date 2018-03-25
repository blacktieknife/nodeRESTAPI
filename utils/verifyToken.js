const _data = require('../lib/data');

module.exports = async (id, phone) => {
    try {   
        const token = await _data.read("tokens", id);
        if(token){
           
            if(token.phone === phone && token.expires > Date.now()){
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch(err){
        return {"Error":"ERROR in Verify Token Function =", err}
    }
}