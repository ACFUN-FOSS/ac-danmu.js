/*
 * @Date: 2020-09-14 20:25:26
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-15 17:10:36
 */

const ProtoBufJs = require("protobufjs");
const ROOT = ProtoBufJs.Root.fromJSON(require("../protos.bundle.json"));

module.exports =
  /**
   *
   * @param {Buffer} buffer
   * @param  client
   */
  function StateHandler(buffer, client) {
    const ZtLiveScStateSignal = ROOT.lookupType("ZtLiveScStateSignal");
    let items = ZtLiveScStateSignal.decode(buffer).item;
    items.forEach((element) => {
      switch (element.signalType) {
        case "CommonStateSignalRecentComment":
          const CommonStateSignalRecentComment = ROOT.lookupType(
            "CommonStateSignalRecentComment"
          );
          let commnets = CommonStateSignalRecentComment.decode(element.payload);
          client.emit("recent-comment", commnets);
          break;
        case "CommonStateSignalDisplayInfo":
          const CommonStateSignalDisplayInfo = ROOT.lookupType(
            "CommonStateSignalDisplayInfo"
          );
          client.emit(
            "live-info",
            CommonStateSignalDisplayInfo.decode(element.payload)
          );
          break;
        case "CommonStateSignalTopUsers":
          const CommonStateSignalTopUsers = ROOT.lookupType(
            "CommonStateSignalTopUsers"
          );
          client.emit(
            "topuser-info",
            CommonStateSignalTopUsers.decode(element.payload)
          );
          break;
        case "CommonStateSignalCurrentRedpackList":
          const CommonStateSignalCurrentRedpackList = ROOT.lookupType(
            "CommonStateSignalCurrentRedpackList"
          );
          client.emit(
            "redpack-info",
            CommonStateSignalCurrentRedpackList.decode(element.payload)
          );
          break;
        case "AcfunStateSignalDisplayInfo":
          break;
        default:
          console.log("未知的和我懒得处理的signal:" + element.signalType);
          break;
      }
    });
  };
