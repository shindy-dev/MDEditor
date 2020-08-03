const jschardet = require('jschardet');
const Iconv = require('iconv').Iconv;

exports.Utf8Cast = class Utf8Cast {
    old_encodeing=null;
    encode(text) {
        this.old_encodeing = jschardet.detect(text).encoding;
        return new Iconv(this.old_encodeing, 'UTF-8//TRANSLIT//IGNORE').convert(text).toString();
    }
    decode(text) {
        if (this.old_encodeing)
            return new Iconv('UTF-8', `${this.old_encodeing}//TRANSLIT//IGNORE`).convert(text).toString();
        else
            return text;
    }
}