<!--
 * @Date: 2020-09-15 00:30:41
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-15 00:50:08
-->

# ac-danmu.js 

### 简介

* ac-danmu.js是[orzogc/acfundanmu](https://github[.com/orzogc/acfundanmu)的Nodejs实现，这两个项目的诞生都离不开[wpscott/AcFunDanmaku](https://github.com/wpscott/AcFunDanmaku/tree/master/AcFunDanmu)提供的实现思路和配置文件，请给他们点Star
* ac-danmu.js是一个用于获取acfun直播弹幕的服务端js组件
* 因为使用了buffer所以不能运行在浏览器环境下

### 可实现

* Promise化的使用方式
* 事件化的使用流程

### 使用方式

``` JavaScript
//使用init(主播房间号)初始化客户端
AcClient.init("8500263").then((ac_client) => {
    //启动websocket连接
    ac_client.wsStart();
    ac_client.on("enter", () => {
        console.log("Enter room success!");
    });
    ac_client.on("recent-comment", (commmnets) => {
        //获得建立连接当前的弹幕列表
        console.log(commmnets);
    });
    ac_client.on("danmaku", (danmaku) => {
        //收到的弹幕
        console.log(danmaku);
    });
});
```

或者

``` JavaScript
//使用init(主播房间号)初始化客户端
ac_client = await AcClient.init("8500263")
//启动websocket连接
ac_client.wsStart();
ac_client.on("enter", () => {
    console.log("Enter room success!");
});
ac_client.on("recent-comment", (commmnets) => {
    //获得建立连接当前的弹幕列表
    console.log(commmnets);
});
ac_client.on("danmaku", (danmaku) => {
    //收到的弹幕
    console.log(danmaku);
});
```

收到的弹幕返回如下

``` JavaScript
{
    content: '晚安',
    sendTimeMs: Long {
        low: -1921110048,
        high: 372,
        unsigned: false
    },
    userInfo: ZtLiveUserInfo {
        avatar: [
            [ImageCdnNode]
        ],
        userId: Long {
            low: 147764,
            high: 0,
            unsigned: false
        },
        nickname: 'NNK',
        badge: '{"medalInfo":{"uperId":100001,"userId":100001,"clubName":"蓝钻","level":100}}',
        userIdentity: ZtLiveUserIdentity {}
    }
}
```

### 安装

 `npm i ac-danmu --save`
