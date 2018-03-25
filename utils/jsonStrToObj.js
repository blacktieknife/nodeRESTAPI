module.exports = (JSONstr) => {
    try {
        const obj = JSON.parse(JSONstr);
        return obj;
    } catch(err){
        return {};
    }
}