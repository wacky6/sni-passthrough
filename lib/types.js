'use strict'

module.exports = {
    isString(obj) {
        return typeof obj === 'string'
    },
    isObject(obj) {
        return    obj !== null     // v8 returns `typeof null` as 'object'
               && typeof obj === 'object'
               && !(obj instanceof Function)
    },
    isFunction(obj) {
        return obj instanceof Function
    }
}
