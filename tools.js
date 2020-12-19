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


const getGiftInfoList  = async (did, userId, st,liveId,authorId)=>{
  "https://api.kuaishouzt.com/rest/zt/live/web/gift/list?subBiz=mainApp&kpn=ACFUN_APP&kpf=PC_WEB&userId=1000000083833313&did=web_977051926EF8F557&acfun.api.visitor_st=ChRhY2Z1bi5hcGkudmlzaXRvci5zdBJwxHhrwAIYkBDIk-o0fgP6zj5fhjQLacOAu3Hb_JSEO5r5bfEhxSSAONvWKnxMSqOYj1_XXDvoLRSMeejNVIRBqN9uF-JDV9oTUJ7p3_VQmIYgukB1RZWRC7VrMhuTLehyKw8irvAUiKymVqLTa95GcRoS250pzNbFUHCOdT8UKxFVrl1fIiBKhLCDW-gEhmYlLcahjQWUDpEH_JZRyWtKfYnrnVQtvygFMAE"
  "https://api.kuaishouzt.com/rest/zt/live/web/gift/list?subBiz=mainApp&kpn=ACFUN_APP&userId=1000000083832646&did=web_2054336874990BEA&kpf=PC_WEB&acfun.api.visitor_st=ChRhY2Z1bi5hcGkudmlzaXRvci5zdBJwh5t9fBxM8BOqP4MgPpd5-JyKneZ3wsfc-jYuqPl-Z2TkLoPBp5aZ8UOrDPFU9Nu6Fmego4nA8IT8H6_f3ZjJJj13jZGe42LLrtJjJDN-qwmWfsjKi16I0EnLCq9xl0rxhst337MiQh39h0Vk7Hg5xhoSdLBYz6JTXhfnkG7uvxEyOPCqIiCiDLmlidWAvepOGcWsFQLTqd9wgbpDnLmSyQOEsusDlSgFMAE"
  const getGiftInfoListURL =
  acUrl.get_kuaishou_zt_giftlist +
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
  console.log(getGiftInfoListURL)
  const res = await got(getGiftInfoListURL, {
    method: "POST",
    headers: {
      Referer: acUrl.acfun_live + authorId,
    },
    form: {
      "visitorId":userId,
      "liveId":liveId
    },
  });
  const resJson = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(resJson.result);
  }
  return resJson.data;
}
module.exports = { getDid, visitorlogin, startPlayInfoByVisitor ,getGiftInfoList};
