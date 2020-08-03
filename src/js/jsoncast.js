const fs = require('fs');
class JsonCast {
    static loadJson(path){
        return JSON.parse(fs.readFileSync(path), (k, v) => {
            return (typeof v === 'string' && (v.match(/^function/) || v.match(/\)\s*=>\s*{/))) ? (new Function('return ' + v))() : v;
        });
    }
    static toJson(data){
        return JSON.stringify(data, (k, v) => {
            return (typeof v === 'function') ? v.toString() : v;
        });
    }
    static exportJson(data, path){
        fs.writeFileSync(path, (typeof data !== 'string') ? this.toJson(data) : data);
    }
}

module.exports = {JsonCast};