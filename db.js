/*
 * @Date: 2020-09-12 11:27:54
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-12 12:05:18
 */
var level = require('level')
var levelDb = level('db-acdm', { createIfMissing: true }, (err, db) => {
    if (err instanceof level.errors.OpenError) {
        console.log('failed to open database')
    }
})

let db = {
    put: (key, value) => {
        console.log(key)
        return new Promise((resolve, reject) => {
            levelDb.put(key, value, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    },
    get: (key) => {
        return new Promise((resolve, reject) => {
            levelDb.get(key, function (err, value) {
                if (err) return reject(err) // likely the key was not found
                else resolve(value)
            })
        })
    }
}

module.exports = db