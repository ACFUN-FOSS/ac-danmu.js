/*
 * @Date: 2020-09-14 20:25:26
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-15 00:16:31
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

        default:
          break;
      }
    });
  };
