/*
 * @Date: 2020-09-11 23:55:10
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-14 11:36:55
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
var proto = require("./proto")
let buffer  = Buffer.from("q80AAQAAASkAAACACA0Qobuaueqv4wEYADhqQAFKiAIIARKDAkNoUmhZMloxYmk1aGNHa3VkbWx6YVhSdmNpNXpkQkp3UDdKZTZoM1NVMWhKR21LYmZzQTdHeWdFSWljRmJFVHUwN2ZFNmZoZzJ1OG1mUmxqQW96elY1WXpsZjhJaUhLYnY1UmZXLXgzdV9mR2d6aElKSzZIaGlyN3ljXzhBNWNEWHBYV1dCSHpOWUpOcnZBYVBpMlRaSjNja0FKd0J6cVNBV2dYdkNCZFRUWV9OQ3JXUTlmZjlCb1NMNWNRWjFPdU1Ha2FGVzZwSjhGMGFqRjVJaUJBWEtXczZTQjlJaXRRZW5sYzR6ZmlXSk91LXRfUzg5ZDZMUmFfbHdqMUJpZ0ZNQUVQAWIJQUNGVU5fQVBQFcG8B9GlyZdIamzJo4AmJ9SOUu952Smy7NBeKovpedSQyNM9fheVW1hMjMRvUaNx0e6vXRyl7x93dvELU96BAW63FeqGWy+rLt4sXMvAWvD40tiYf/q+pWRLojKxnVVSkRl6mLbknDDqJIgpvmnyJ8JK0/VpdWDb6F7obZLWy8Q=","base64")
proto.decodePackTest(buffer,"GUSzetFTEQG1knY847DefA==")