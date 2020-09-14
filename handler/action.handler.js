/*
 * @Date: 2020-09-14 20:25:39
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-15 00:23:30
 */
const ProtoBufJs = require("protobufjs");
const ROOT = ProtoBufJs.Root.fromJSON(require("../protos.bundle.json"));

module.exports =
  /**
   *
   * @param {Buffer} buffer
   * @param  client
   */
  function ActionHandler(buffer, client) {
    const ZtLiveScActionSignal = ROOT.lookupType("ZtLiveScActionSignal");

    let items = ZtLiveScActionSignal.decode(buffer).item;
    items.forEach((element) => {
      switch (element.signalType) {
        case "CommonActionSignalComment":
          console.log(element);
          const CommonActionSignalComment = ROOT.lookupType(
            "CommonActionSignalComment"
          );
          element.payload.forEach((e) => {
            let danmaku = CommonActionSignalComment.decode(e);
            client.emit("danmaku", danmaku);
          });
          break;

        default:
          break;
      }
    });
  };
