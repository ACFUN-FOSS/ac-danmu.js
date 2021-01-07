/*
 * @Date: 2020-09-12 10:57:39
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-14 17:58:53
 */
const cookie = require("cookie");
const got = require("got");
const acConfig = require("./config/config.json");
const acUrl = require("./config/url_set.json");
const querystring = require("querystring");
const { isArray } = require("lodash");

const getDid = async () => {
  const res = await got(acUrl.acfun_login_main);
  let did_cookie = cookie.parse(res.headers["set-cookie"][1]);
  return did_cookie._did;
};

const visitorlogin = async (did) => {
  const res = await got("https://id.app.acfun.cn/rest/app/visitor/login", {
    method: "POST",
    headers: {
      cookie: "_did=" + did,
    },
    form: {
      sid: acConfig.acfun_visitor_sid,
    },
  });
  const resJson = JSON.parse(res.body);
  if (resJson.result == 0) {
    return {
      acSecurity: resJson["acSecurity"],
      visitorSt: resJson[acConfig.acfun_visitorSt_name],
      userId: resJson["userId"],
    };
  }
};

const userlogin = async (did, users) => {
  if (!isArray(users)) {
    users = [users]
  }
  const user = users[Math.floor(Math.random() * 10000) % users.length]
  const res = await got(acUrl.acfunSignInURL + "?" + querystring.stringify(
    user,
    "&",
    "="), {
    headers: {
      cookie: "_did=" + did,
    },
    from: user,
    method: "POST",
  });
  const resJson = JSON.parse(res.body)
  if (resJson.result != 0) {
    throw new Error(resJson.result);
  }
  let acPasstoken = cookie.parse(res.headers["set-cookie"][0]).acPasstoken;
  let auth_key = cookie.parse(res.headers["set-cookie"][1]).auth_key;
  const resLogin = await got("https://id.app.acfun.cn/rest/web/token/get?sid=acfun.midground.api", {
    method: "POST",
    headers: {
      cookie: `_did=${did};acPasstoken=${acPasstoken};auth_key=${auth_key}`,
    }
  });
  const resLoginJson = JSON.parse(resLogin.body);
  if (resLoginJson.result == 0) {
    return {
      acSecurity: resLoginJson["ssecurity"],
      visitorSt: resLoginJson["acfun.midground.api_st"],
      userId: resLoginJson["userId"],
    };
  }

}

const startPlayInfoByLogin = async (did, userId, apist, author_id) => {
  const startPlayUrl =
    acUrl.acfun_kuaishou_zt_startplay +
    querystring.stringify(
      {
        subBiz: acConfig.kuaishou.subBiz,
        kpn: acConfig.kuaishou.kpn,
        userId: userId,
        did: did,
        kpf: acConfig.kuaishou.kpf,
        "acfun.midground.api_st": apist,
      },
      "&",
      "="
    );
  const res = await got(startPlayUrl, {
    method: "POST",
    headers: {
      Referer: acUrl.acfun_live + author_id,
    },
    form: {
      authorId: author_id,
      pullStreamType: "FLV",
    },
  });
  const resJson = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(resJson.result);
  }
  return {
    liveId: resJson.data["liveId"],
    availableTickets: resJson.data["availableTickets"],
    enterRoomAttach: resJson.data["enterRoomAttach"],
  };
};

const startPlayInfoByVisitor = async (did, userId, st, author_id) => {
  const startPlayUrl =
    acUrl.acfun_kuaishou_zt_startplay +
    querystring.stringify(
      {
        subBiz: acConfig.kuaishou.subBiz,
        kpn: acConfig.kuaishou.kpn,
        userId: userId,
        did: did,
        kpf: acConfig.kuaishou.kpf,
        [acConfig.acfun_visitorSt_name]: st,
      },
      "&",
      "="
    );
  const res = await got(startPlayUrl, {
    method: "POST",
    headers: {
      Referer: acUrl.acfun_live + author_id,
    },
    form: {
      authorId: author_id,
      pullStreamType: "FLV",
    },
  });
  const resJson = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(resJson.result);
  }
  return {
    liveId: resJson.data["liveId"],
    availableTickets: resJson.data["availableTickets"],
    enterRoomAttach: resJson.data["enterRoomAttach"],
  };
};


const getGiftInfoList = async (did, userId, st, liveId, authorId, isLogin) => {
  const getGiftInfoListURL =
    acUrl.get_kuaishou_zt_giftlist +
    querystring.stringify(
      {
        subBiz: acConfig.kuaishou.subBiz,
        kpn: acConfig.kuaishou.kpn,
        userId: userId,
        did: did,
        kpf: acConfig.kuaishou.kpf,
        [isLogin ? acConfig.acfun_userSt_name : acConfig.acfun_visitorSt_name]: st,
      },
      "&",
      "="
    );
  const res = await got(getGiftInfoListURL, {
    method: "POST",
    headers: {
      Referer: acUrl.acfun_live + authorId,
    },
    form: {
      "visitorId": userId,
      "liveId": liveId
    },
  });
  const resJson = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(resJson.result);
  }
  return resJson.data;
}
module.exports = { getDid, visitorlogin, startPlayInfoByVisitor, getGiftInfoList, startPlayInfoByLogin, userlogin };
