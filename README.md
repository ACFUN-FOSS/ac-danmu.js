<!--
 * @Date: 2020-09-15 00:30:41
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-10-09 15:50:49
-->

# ac-danmu.js

## 简介

* ac-danmu.js是[orzogc/acfundanmu](https://github[.com/orzogc/acfundanmu)的Nodejs实现，这两个项目的诞生都离不开[wpscott/AcFunDanmaku](https://github.com/wpscott/AcFunDanmaku/tree/master/AcFunDanmu)提供的实现思路和配置文件，请给他们点Star

## ac-danmu.js是一个用于获取acfun直播弹幕的服务端js组件

* 因为使用了buffer所以不能运行在浏览器环境下, 编写使用node v12 lts

### 可实现

* Promise化的使用方式
* 事件化的使用流程

### 使用方式

``` JavaScript
const AcClient = require("ac-danmu")

//使用init(主播房间号)初始化客户端
AcClient("8500263").then((ac_client) => {
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
const AcClient = require("ac-danmu")

//使用init(主播房间号)初始化客户端
ac_client = await AcClient("8500263")
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

### 事件列表

| 事件           | 触发                    | payload类型                        |
|----------------|-------------------------|------------------------------------|
| banana         | 有人发送了香蕉            | AcfunActionSignalThrowBanana               |
| danmaku        | 当直播中任意用户发送弹幕产生 | CommonActionSignalComment          |
| enter          | 程序进入直播间            | null                               |
| follow         | 有人关注了主播            | CommonActionSignalUserFollowAuthor |
| gift           | 有人发送礼物              | CommonActionSignalGift        |
| live-info      | 当前直播间数据状态         |CommonStateSignalDisplayInfo      |
| redpack-info   |    不知道              |   CommonStateSignalCurrentRedpackList     |
| recent-comment | 当前弹幕列表              | CommonActionSignalComment[]        |
| topuser-info   | 前几名用户的数据          |  CommonStateSignalTopUsers        |
|user-enter|用户进入直播间|CommonActionSignalUserEnterRoom

### 安装

 `npm i ac-danmu --save`
