const _data = require("./data");
const hashPassword = require("../utils/hashPassword");
const verifyToken = require("../utils/verifyToken");

const _users = {};

//required data: firstname, lastname, phone, password, tosAgreement
_users.post = async (data, callback) => {
    //check that all required field are filled out
    const firstName = data.payload && typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = data.payload && typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = data.payload && typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = data.payload && typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = data.payload && typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        try {
            const user = await _data.read('users', phone);
            if(!user) {
                const hashedPassword = hashPassword(password);"tos"
                const userObj = {};
                userObj.firstName = firstName;
                userObj.lastName = lastName;
                userObj.phone = phone;
                userObj.password = hashedPassword;
                userObj.tosAgreement = true;
                _data.create('users', phone, userObj);
                callback(200);
            } else {
                callback(406, {"Error":"user already exists"});
            }
        } catch(err) {
            callback(500, {"Error":err});
        }

    } else {
        callback(400, {"Error": "Missing required fields"});
    }
}


_users.get = async (data, callback) => {
    const phone = typeof(data.queryStringObject.phone) === "string" && data.queryStringObject.phone.length === 10 ? data.queryStringObject.phone : false;
    if(phone) {
        try {
            const userToken = typeof(data.headers.token) === 'string' ? data.headers.token : false;
            const tokenValid = await verifyToken(userToken, phone);
            if(tokenValid) {
                const user = await _data.read('users',phone);
                if(user){
                        callback(200, user);
                } else {
                    callback(404, {"Error":"user not found"});   
                }
            } else {
                callback(403, {"error": "invalid token"});
            }
        } catch(err) {
            callback(500,{"Error":"Error in users get promise function"});
        }
    } else {
        callback(400, {"Error":"User not found with provided phone "+data.queryStringObject.phone});
    }
};

//required:phone
//optional: firstName, LastName, password
_users.put = async (data, callback) => {
    const phone = typeof(data.payload.phone) === "string" && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
    //Check options
    const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    //check if phone valid 
    if(phone) {
        if(firstName || lastName || password){
            try {
                const userToken = typeof(data.headers.token) === "string" ? data.headers.token : false;
                const tokenValid = await verifyToken(userToken.phone, userToken.id);
                if(tokenValid) {
                    const user = await _data.read('users', phone);
                    if(user){
                        if(firstName){
                            user.firstName = firstName;
                        }
                        if(lastName){
                            user.lastName = lastName;
                        }
                        if(password){
                            user.password = hashPassword(password);
                        }
                        //store the new updates
                        
                        await _data.update('users', phone, user);
                        callback(200);
                    } else {
                        callback(400,{"error":"The user does not exist"});
                    }
                } else {
                    callback(403,{"error":"token is invalid"});
                }

                
            } catch(err) {
                console.log("ERROR FROM THE CATCH INSIDE OF USER PUT FUNCTION",err)
                callback(400,{"error":"ERROR WITH DATA READ FUNCTION OR USERS PUT FUNCTION"});
            }
        } else {
            callback(400, {"error":"Missing fields to update"});
        }
    } else {
        callback(400, {"error":"Missing required field or bad phone #"});
    }
};

//required field:phone
_users.delete = async (data, callback) => {
    const phone = typeof(data.payload.phone) === "string" && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
    //check if phone valid 
    if(phone) {
            try {
                const userToken = typeof(data.headers.token) === "string" ? data.headers.token : false;
                const tokenValid = await verifyToken(userToken, phone);
                if(tokenValid) {
                    const user = await _data.read('users', phone);
                    if(user){
                        await _data.delete('users', phone);
                        const userChecks = user.checks instanceof Array && user.checks.length > 0 ? user.checks : [];
                        const checksToDelete = userChecks.length;
                        if(checksToDelete > 0) {
                            let checksDeleted = 0;
                            userChecks.forEach((check)=>{
                                _data.delete('checks', check);
                                checksDeleted ++;
                                if(checksDeleted === checksToDelete) {
                                   callback(200);
                                }
                            });
                        } else {
                            callback(200);
                        }
                    } else {
                        callback(400,{"error":"The user does not exist"});
                    }
                } else {
                    callback(403,{"error":"token is invalid"});
                }
            } catch(err) {
                console.log("ERROR FROM THE CATCH INSIDE OF USER DELETE FUNCTION",err)
                callback(400,{"error":"ERROR WITH DATA READ FUNCTION OR USERS PUT FUNCTION"});
            }
    } else {
        callback(400, {"error":"Missing required field or bad phone #"});
    }
};

module.exports = _users;