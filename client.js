/*
 * @Date: 2020-09-12 16:54:29
 * @LastEditors: kongzenwang
 * @LastEditTime: 2020-12-21 16:31:49
 */
const ProtoBufJs = require("protobufjs");
const ROOT = ProtoBufJs.Root.fromJSON(require("./protos.bundle.json"));
const tools = require("./tools");
const _ = require("lodash")
const commandHandler = require("./handler/command.handler");
var WebSocketClient = require("websocket").client;
const proto = require("./proto");
var events = require("events");
const { resolve } = require("path");

function AcClient(
  did,
  visitorSt,
  acSecurity,
  userId,
  liveId,
  availiableTickets,
  enterRoomAttach,
  giftList
) {
  events.EventEmitter.call(this);
  this.did = did;
  this.visitorSt = visitorSt;
  this.acSecurity = acSecurity;
  this.userId = userId;
  this.liveId = liveId;
  this.availiableTickets = availiableTickets;
  this.enterRoomAttach = enterRoomAttach;
  this.connection = null;
  this.seqId = 1;
  this.instanceId = 0;
  this.sessionKey = "";
  this.headerSeqId = 1;
  this.heartbeatSeqId = 1;
  this.ticketIndex = 0;
  this.retryCount = 0;
  this.timer = null;
  this.giftList = giftList

  this.sendBytes = (buffer, test) => {
    if (this.connection.connected) {
      this.connection.sendBytes(buffer);
      this.seqId++;
    } else console.log("ws->reconnect");
  };
  //确定返回类型
  this.decodeProcess = async (buffer) => {
    const DownstreamPayload = ROOT.lookupType("DownstreamPayload");
    let header = proto.decodeHeader(buffer);
    if (header.encryptionMode == 1) this.processRegisterResponse(buffer);
    else {
      let decrypted = proto.decrypt(buffer, this.sessionKey);
      if (!decrypted) {
        return false
      }
      let payload = DownstreamPayload.decode(decrypted);
      //console.log(payload)
      await commandHandler(payload, this);
    }
  };

  this.getGiftName = (giftId) => {
    const giftDetail = _.find(this.giftList, { "giftId": giftId })
    return giftDetail
  }

  //处理RR
  this.processRegisterResponse = (buffer) => {
    const DownstreamPayload = ROOT.lookupType("DownstreamPayload");
    const RegisterResponse = ROOT.lookupType("RegisterResponse");
    let decrypted = proto.decrypt(buffer, this.acSecurity);
    let payload = DownstreamPayload.decode(decrypted);
    let rr = RegisterResponse.decode(payload.payloadData);
    this.instanceId = rr.instanceId;
    this.sessionKey = rr.sessKey.toString("base64");
    this.sendBytes(
      proto.genKeepAlivePack(
        this.seqId,
        this.instanceId,
        this.userId,
        this.sessionKey
      )
    );
    this.sendBytes(
      proto.genEnterRoomPack(
        this.seqId,
        this.instanceId,
        this.userId,
        this.sessionKey,
        this.enterRoomAttach,
        this.availiableTickets[this.ticketIndex],
        this.liveId
      )
    );
  };
  this.wsStart = () => {
    var client = new WebSocketClient();

    client.on("connectFailed", function (error) {
      console.log("Connect Error: " + error.toString());
    });

    client.on("connect", (connection) => {
      console.log("WebSocket Client to Kuaishou Connected");
      this.connection = connection;
      let register = proto.genRegisterPack(
        this.seqId,
        this.instanceId,
        this.userId,
        this.acSecurity,
        this.visitorSt
      );
      this.sendBytes(register, "dr");
      this.connection.on("error", function (error) {
        console.log("Connection Error: " + error.toString());
      });
      this.connection.on("close", () => {
        console.warn("ws connection closed.");
        this.seqId = 1;
        this.emit("decode-error")
      });
      this.connection.on("message", async (message) => {
        //console.log(message)
        try {
          if (await this.decodeProcess(message.binaryData) === false) {
            this.emit("decode-error")
          }
        } catch (error) {
          console.log(error)
          this.connection.close()
        }

      });
    });

    client.connect("wss://link.xiatou.com/");
  };

}

AcClient.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = async (author_id, option = { login: false }) => {
  const did = await tools.getDid();
  if (option.login) {
    if (!option.userinfo) {
      throw new Error("must pass userinfo by using login mode")
    }
    const login_info = await tools.userlogin(did, option.userinfo).catch((err) => {
      console.log("error:"+err.message)
      return
    });
    const visitorSt = login_info.visitorSt;
    const userId = login_info.userId;
    const acSecurity = login_info.acSecurity;
    const live_info = await tools.startPlayInfoByLogin(did, userId, visitorSt, author_id).catch((err) => {
      console.log("error:"+err.message)
      return
    });
    if (!live_info) return
    const availiableTickets = live_info["availableTickets"];
    const enterRoomAttach = live_info.enterRoomAttach;
    const liveId = live_info.liveId;
    const giftListRet = await tools.getGiftInfoList(did, userId, visitorSt, liveId, author_id, true).catch((err) => {
      console.log("error:"+err.message)
      return
    });
    return new AcClient(
      did,
      visitorSt,
      acSecurity,
      userId,
      liveId,
      availiableTickets,
      enterRoomAttach,
      giftListRet.giftList
    );
  } else {
    const login_info = await tools.visitorlogin(did).catch((err) => {
      console.log("error:"+err.message)
      return
    });
    const visitorSt = login_info.visitorSt;
    const userId = login_info.userId;
    const acSecurity = login_info.acSecurity;
    const live_info = await tools
      .startPlayInfoByVisitor(did, userId, visitorSt, author_id)
      .catch((err) => {
        console.log("error:"+err.message)
        return
      });
    if (!live_info) return
    const availiableTickets = live_info["availableTickets"];
    const enterRoomAttach = live_info.enterRoomAttach;
    const liveId = live_info.liveId;
    const giftListRet = await tools.getGiftInfoList(did, userId, visitorSt, liveId, author_id).catch((err) => {
      console.log("error:"+err.message)
      return
    });
    return new AcClient(
      did,
      visitorSt,
      acSecurity,
      userId,
      liveId,
      availiableTickets,
      enterRoomAttach,
      giftListRet.giftList
    );
  }


  return new AcClient(
    did,
    visitorSt,
    acSecurity,
    userId,
    liveId,
    availiableTickets,
    enterRoomAttach,
    giftListRet.giftList
  );
};
