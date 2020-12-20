/*
 * @Date: 2020-09-12 16:54:29
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-16 02:27:21
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
    } else console.log("Ws closed");
  };
  //确定返回类型
  this.decodeProcess = async (buffer) => {
    const DownstreamPayload = ROOT.lookupType("DownstreamPayload");
    let header = proto.decodeHeader(buffer);
    if (header.encryptionMode == 1) this.processRegisterResponse(buffer);
    else {
      let decrypted = proto.decrypt(buffer, this.sessionKey);
      if(!decrypted){
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
      console.log("WebSocket Client Connected");
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
        console.log("fvck!");
        this.seqId = 1;
        this.emit("decode-error")
      });
      this.connection.on("message", async (message) => {
        //console.log(message)
        try {
          if(await this.decodeProcess(message.binaryData)===false){
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

module.exports = async (author_id) => {
  const did = await tools.getDid();
  const login_info = await tools.visitorlogin(this.did);
  const visitorSt = login_info.visitorSt;
  const userId = login_info.userId;
  const acSecurity = login_info.acSecurity;
  const live_info = await tools
    .startPlayInfoByVisitor(did, userId, visitorSt, author_id)
    .catch((err) => {
      console.log("直播间可能煤油开播");
    });
   if(!live_info) return
  const availiableTickets = live_info["availableTickets"];
  const enterRoomAttach = live_info.enterRoomAttach;
  const liveId = live_info.liveId;
  const giftListRet = await tools.getGiftInfoList(did, userId, visitorSt, liveId, author_id)
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
