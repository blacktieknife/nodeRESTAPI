module.exports = (strLen) => {
    strLen = typeof(strLen) === 'number' && strLen > 0 ? strLen : false;
    if(strLen) {
        const possibleChars = "abcdefghijklmnopqrstuvwxyz123456789"
        let str = '';
        for(i=0; i<=strLen-1; i++){
            let randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            str += randomChar;    
        }
        return str;
    } else {
        return false;
    }
}