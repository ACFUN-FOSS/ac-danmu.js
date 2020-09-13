/*
 * @Date: 2020-09-11 23:55:10
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-12 10:54:55
 */
// var request = require("request")

// request.post("https://id.app.acfun.cn/rest/web/login/signin",{
//     form:{
//         username:"17610079662",
//         password:"sw960602",
//         key:"",
//         captcha:""
//     }
// },(err,httpResponse,body)=>{
//     console.log(httpResponse.headers["set-cookie"])
// })

var got = require("got")
let test = async () =>{
const res = await got("https://id.app.acfun.cn/rest/web/login/signin",{
    method:"POST",
    form:{
                username:"17610079662",
                password:"sw960602",
                key:"",
                captcha:""
            }
})
console.log(res)
}

test()