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

let getDid = async () => {
  const res = await got(acUrl.acfun_login_main);
  let did_cookie = cookie.parse(res.headers["set-cookie"][1]);
  return did_cookie._did;
};

let visitorlogin = async (did) => {
  const res = await got("https://id.app.acfun.cn/rest/app/visitor/login", {
    method: "POST",
    headers: {
      cookie: "_did=" + did,
    },
    form: {
      sid: acConfig.acfun_visitor_sid,
    },
  });
  let resJson = JSON.parse(res.body);
  if (resJson.result == 0) {
    return {
      acSecurity: resJson["acSecurity"],
      visitorSt: resJson[acConfig.acfun_visitorSt_name],
      userId: resJson["userId"],
    };
  }
};

let startPlayInfoByVisitor = async (did, userId, st, author_id) => {
  let startPlayUrl =
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
  let resJson = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(resJson.result);
  }
  return {
    liveId: resJson.data["liveId"],
    availableTickets: resJson.data["availableTickets"],
    enterRoomAttach: resJson.data["enterRoomAttach"],
  };
};

module.exports = { getDid, visitorlogin, startPlayInfoByVisitor };
