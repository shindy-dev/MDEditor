const fs = require('fs');
class JsonIo {
    static load(path, dirname = "") {
        return JSON.parse(fs.readFileSync(path), (k, v) => {
            v = (typeof v === 'string' && dirname) ? v.replace(/^\./, dirname) : v;
            return (typeof v === 'string' && (v.match(/^function/) || v.match(/\)\s*=>\s*{/))) ? (new Function('return ' + v)()) : v;
        });
    }
    static object2json(data) {
        return JSON.stringify(data, (k, v) => {
            return (typeof v === 'function') ? v.toString() : v;
        });
    }
    static save(data, path) {
        fs.writeFileSync(path, (typeof data !== 'string') ? this.object2json(data) : data);
    }
}

module.exports = { JsonIo };