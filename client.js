/*
 * @Date: 2020-09-12 16:54:29
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-15 00:51:13
 */
const ProtoBufJs = require("protobufjs");
const ROOT = ProtoBufJs.Root.fromJSON(require("./protos.bundle.json"));
const tools = require("./tools");
const StateHandler = require("./handler/state.handler");
const ActionHandler = require("./handler/action.handler");
var WebSocketClient = require("websocket").client;
const proto = require("./proto");
var events = require("events");
const { unzip } = require("zlib");
const { promisify } = require("util");
const do_unzip = promisify(unzip);

class AcClient {
  did;
  visitorSt;
  acSecurity;
  userId;
  liveId;
  availiableTickets;
  enterRoomAttach;
  connection;
  seqId = 1;
  instanceId = 0;
  sessionKey = "";
  headerSeqId = 1;
  heartbeatSeqId = 1;
  ticketIndex = 0;
  retryCount = 0;
  timer;

  constructor(
    did,
    visitorSt,
    acSecurity,
    userId,
    liveId,
    availiableTickets,
    enterRoomAttach
  ) {
    events.EventEmitter.call(this);
    this.did = did;
    this.visitorSt = visitorSt;
    this.acSecurity = acSecurity;
    this.userId = userId;
    this.liveId = liveId;
    this.availiableTickets = availiableTickets;
    this.enterRoomAttach = enterRoomAttach;
  }
  static init = async (author_id) => {
    let did = await tools.getDid();
    const login_info = await tools.visitorlogin(this.did);
    let visitorSt = login_info.visitorSt;
    let userId = login_info.userId;
    let acSecurity = login_info.acSecurity;
    const live_info = await tools
      .startPlayInfoByVisitor(did, userId, visitorSt, author_id)
      .catch((err) => {
        console.log("直播间可能煤油开播");
      });
    let availiableTickets = live_info["availableTickets"];
    let enterRoomAttach = live_info.enterRoomAttach;
    let liveId = live_info.liveId;
    return new AcClient(
      did,
      visitorSt,
      acSecurity,
      userId,
      liveId,
      availiableTickets,
      enterRoomAttach
    );
  };
  sendBytes = (buffer) => {
    if (this.connection.connected) {
      this.connection.sendBytes(buffer);
      this.seqId++;
    } else console.log("Ws closed");
  };
  //确定返回类型
  decodeProcess = async (buffer) => {
    const DownstreamPayload = ROOT.lookupType("DownstreamPayload");
    let header = proto.decodeHeader(buffer);
    if (header.encryptionMode == 1) this.processRegisterResponse(buffer);
    else {
      let decrypted = proto.decrypt(buffer, this.sessionKey);
      let payload = DownstreamPayload.decode(decrypted);
      switch (payload.command) {
        case "Push.ZtLiveInteractive.Message":
          const ZtLiveScMessage = ROOT.lookupType("ZtLiveScMessage");
          const CompressionType = ROOT.lookupEnum(
            "ZtLiveScMessage.CompressionType"
          );
          //   setInterval(()=>{
          //     this.sendBytes(
          //         proto.genPushMessagePack(
          //           this.seqId,
          //           this.instanceId,
          //           this.userId,
          //           this.sessionKey
          //         )
          //       )
          //   },1000)

          let ztPayload = ZtLiveScMessage.decode(payload.payloadData);
          let msg = ztPayload.payload;
          if (ztPayload.compressionType == CompressionType.values.GZIP)
            msg = await do_unzip(ztPayload.payload);
          switch (ztPayload.messageType) {
            case "ZtLiveScActionSignal":
              ActionHandler(msg, this);
              break;
            case "ZtLiveScStateSignal":
              //todo
              StateHandler(msg, this);
              break;
            case "ZtLiveScNotifySignal":
              break;

            default:
              break;
          }
          //console.log(ZtLiveScMessage.decode(payload.payloadData));

          //console.log(dt.errorMsg.toString())
          break;
        case "Basic.KeepAlive":
          const KeepAliveResponse = ROOT.lookupType("KeepAliveResponse");
          let keepAliveResponse = KeepAliveResponse.decode(payload.payloadData);
          //console.log(keepAliveResponse);
          break;
        case "Global.ZtLiveInteractive.CsCmd":
          const ZtLiveCsCmdAck = ROOT.lookupType("ZtLiveCsCmdAck");
          let ztLiveCsCmdAck = ZtLiveCsCmdAck.decode(payload.payloadData);
          switch (ztLiveCsCmdAck.cmdAckType) {
            case "ZtLiveCsEnterRoomAck":
              const ZtLiveCsEnterRoomAck = ROOT.lookupType(
                "ZtLiveCsEnterRoomAck"
              );
              let enterRoomAck = ZtLiveCsEnterRoomAck.decode(
                ztLiveCsCmdAck.payload
              );
              //发送进入事件
              this.emit("enter", enterRoomAck);
              let ms = enterRoomAck.heartbeatIntervalMs.toNumber();
              this.timer = setInterval(() => {
                this.sendBytes(
                  proto.genHeartbeatPack(
                    this.seqId,
                    this.instanceId,
                    this.userId,
                    this.sessionKey,
                    this.availiableTickets[this.ticketIndex],
                    this.liveId
                  )
                );
              }, ms);

              break;

            default:
              break;
          }
          break;
        default:
          break;
      }
    }
  };

  //处理RR
  processRegisterResponse = (buffer) => {
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
  wsStart = () => {
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
      this.sendBytes(register);
      connection.on("error", function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on("close", () => {
        console.log("fvck!");
        this.seqId = 1;
        setTimeout(() => {
          console.log("连接失败，正在重试");
          client.connect("wss://link.xiatou.com/");
        }, 5000);
      });
      connection.on("message", (message) => {
        //console.log(message)
        this.decodeProcess(message.binaryData);
      });
    });

    client.connect("wss://link.xiatou.com/");
  };
}
AcClient.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = AcClient;
