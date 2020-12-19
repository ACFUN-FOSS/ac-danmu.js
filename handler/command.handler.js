/*
 * @Date: 2020-09-15 14:52:17
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-16 02:28:13
 */

const ProtoBufJs = require("protobufjs");
const ROOT = ProtoBufJs.Root.fromJSON(require("../protos.bundle.json"));
const StateHandler = require("./state.handler");
const ActionHandler = require("./action.handler");
const { unzip } = require("zlib");
const { promisify } = require("util");
const do_unzip = promisify(unzip);
const proto = require("../proto");
module.exports =
  /**
   *
   * @param {Object} payload
   * @param  client
   */
  async function CommandHandler(payload, client) {
    switch (payload.command) {
      case "Push.ZtLiveInteractive.Message":
        const ZtLiveScMessage = ROOT.lookupType("ZtLiveScMessage");
        const CompressionType = ROOT.lookupEnum(
          "ZtLiveScMessage.CompressionType"
        );
        client.sendBytes(
          proto.genPushMessagePack(
            client.seqId,
            client.instanceId,
            client.userId,
            client.sessionKey
          ,"d4")
        );
        let ztPayload = ZtLiveScMessage.decode(payload.payloadData);
        let msg = ztPayload.payload;
        if (ztPayload.compressionType == CompressionType.values.GZIP)
          msg = await do_unzip(ztPayload.payload);
        switch (ztPayload.messageType) {
          case "ZtLiveScActionSignal":
            ActionHandler(msg, client);
            break;
          case "ZtLiveScStateSignal":
            //todo
            StateHandler(msg, client);
            break;
          case "ZtLiveScNotifySignal":
            //todo
            break;
          case "ZtLiveScStatusChanged":
            const ZtLiveScStatusChanged = ROOT.lookupType(
              "ZtLiveScStatusChanged"
            );
            const liveStateType = ROOT.lookupEnum("ZtLiveScStatusChanged.Type");
            ztLiveScStatusChanged = ZtLiveScStatusChanged.decode(
              ztPayload.payload
            );
            if (
              ztLiveScStatusChanged.type == liveStateType.values.LIVE_CLOSED ||
              ztLiveScStatusChanged.type == liveStateType.values.LIVE_BANNED
            )
              console.log("live结束或者被Ban");
            break;
          case "ZtLiveScTicketInvalid":
            console.log("changeKey");
            client.ticketIndex =
              (client.ticketIndex + 1) / client.availiableTickets.length;
            client.sendBytes(
              proto.genEnterRoomPack(
                client.seqId,
                client.instanceId,
                client.userId,
                client.sessionKey,
                client.enterRoomAttach,
                client.availiableTickets[client.ticketIndex],
                client.liveId
              ,"d6")
            );
          default:
            console.log("unkown message type:" + ztPayload.messageType);
            break;
        }
        break;
      case "Basic.KeepAlive":
        const KeepAliveResponse = ROOT.lookupType("KeepAliveResponse");
        let keepAliveResponse = KeepAliveResponse.decode(payload.payloadData);
        //todo 处理返回
        break;
      case "Basic.Ping":
        //todo
        break;
      case "Basic.Unregister":
        //todo
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
            client.emit("enter", enterRoomAck);
            let ms = enterRoomAck.heartbeatIntervalMs.toNumber()?enterRoomAck.heartbeatIntervalMs.toNumber():1000;
            client.timer = setInterval(() => {
              client.sendBytes(
                proto.genHeartbeatPack(
                  client.seqId,
                  client.instanceId,
                  client.userId,
                  client.sessionKey,
                  client.availiableTickets[client.ticketIndex],
                  client.liveId
                ),"d7"
              );
            }, ms);
            break;
          case "ZtLiveCsHeartbeatAck":
            //todo
            break;
          case "ZtLiveCsUserExitAck":
            //todo
            break;
          default:
            console.log("这消息可能有点毛病");
            break;
        }
        break;
      case "Push.SyncSession":
        //todo
        break;
      case "Push.DataUpdate":
        //todo
        break;
      default:
        console.log("啊这，这消息是：" + payload.command);
        break;
    }
  };
