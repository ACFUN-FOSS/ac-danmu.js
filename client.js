/*
 * @Date: 2020-09-12 16:54:29
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-14 17:46:25
 */
const ProtoBufJs = require("protobufjs");
const ROOT = ProtoBufJs.Root.fromJSON(require("./protos.bundle.json"));
const tools = require("./tools")
var WebSocketClient = require('websocket').client;
const proto = require("./proto");
const { defaultHandler } = require("got/dist/source");
class AcClient {
    did
    visitorSt
    acSecurity
    userId
    liveId
    availiableTickets
    enterRoomAttach
    connection
    seqId = 1
    instanceId = 0
    sessionKey = ""
    headerSeqId = 1
    heartbeatSeqId = 1
    ticketIndex = 0
    retryCount = 0
    timer
    constructor(did, visitorSt, acSecurity, userId, liveId, availiableTickets, enterRoomAttach) {
        this.did = did
        this.visitorSt = visitorSt
        this.acSecurity = acSecurity
        this.userId = userId
        this.liveId = liveId
        this.availiableTickets = availiableTickets
        this.enterRoomAttach = enterRoomAttach
    }
    static init = async (author_id) => {
        let did = await tools.getDid()
        const login_info = await tools.visitorlogin(this.did)
        let visitorSt = login_info.visitorSt
        let userId = login_info.userId
        let acSecurity = login_info.acSecurity
        const live_info = await tools.startPlayInfoByVisitor(did, userId, visitorSt, author_id)
        let availiableTickets = live_info["availableTickets"]
        let enterRoomAttach = live_info.enterRoomAttach
        let liveId = live_info.liveId
        return new AcClient(did, visitorSt, acSecurity, userId, liveId, availiableTickets, enterRoomAttach)
    }
    sendBytes = (buffer) => {
        if (this.connection.connected) {
            this.connection.sendBytes(buffer);
            this.seqId++
        } else console.log("Ws closed")
    }
    //确定返回类型
    decodeProcess = (buffer) => {
        const DownstreamPayload = ROOT.lookupType("DownstreamPayload")
        let header = proto.decodeHeader(buffer)
        if (header.encryptionMode == 1) this.processRegisterResponse(buffer)
        else {
            let decrypted = proto.decrypt(buffer, this.sessionKey)
            let payload = DownstreamPayload.decode(decrypted)
            //console.log(payload)
            switch (payload.command) {
                case 'Push.ZtLiveInteractive.Message':
                    const ZtLiveCsCmdAck = ROOT.lookupType("ZtLiveCsCmdAck")
                    let dt = ZtLiveCsCmdAck.decode(payload.payloadData)
                    //console.log(dt.errorMsg.toString())
                    break;
                case "Basic.KeepAlive":
                    const KeepAliveResponse  = ROOT.lookupType("KeepAliveResponse")
                    let keepAliveResponse = KeepAliveResponse.decode(payload.payloadData)
                    let ms = keepAliveResponse.serverMsec.toString()
                    console.log(ms)
                    break;
                case "Global.ZtLiveInteractive.CsCmd": break
                default:
                    break;
            }
        }
    }


    //处理RR 
    processRegisterResponse = (buffer) => {
        const DownstreamPayload = ROOT.lookupType("DownstreamPayload")
        const RegisterResponse = ROOT.lookupType("RegisterResponse")
        let decrypted = proto.decrypt(buffer, this.acSecurity)
        let payload = DownstreamPayload.decode(decrypted)
        let rr = RegisterResponse.decode(payload.payloadData)
        this.instanceId = rr.instanceId
        this.sessionKey = rr.sessKey.toString("base64")
        this.sendBytes(proto.genKeepAlivePack(this.seqId, this.instanceId, this.userId, this.sessionKey))
        this.sendBytes(proto.genEnterRoomPack(this.seqId, this.instanceId, this.userId, this.sessionKey, this.enterRoomAttach, this.availiableTickets[this.ticketIndex], this.liveId))
    }
    wss = () => {

        var client = new WebSocketClient();

        client.on('connectFailed', function (error) {
            console.log('Connect Error: ' + error.toString());
        });

        client.on('connect', (connection) => {
            console.log('WebSocket Client Connected');
            this.connection = connection
            let register = proto.genRegisterPack(this.seqId, this.instanceId, this.userId, this.acSecurity, this.visitorSt)
            this.sendBytes(register)
            connection.on('error', function (error) {
                console.log("Connection Error: " + error.toString());
            });
            connection.on('close', () => {
                console.log("fvck!")
                this.seqId = 1
                setTimeout(() => {
                    client.connect('wss://link.xiatou.com/');
                }, 5000)
            });
            connection.on('message', (message) => {
                //console.log(message)
                this.decodeProcess(message.binaryData)
            });
        });

        client.connect('wss://link.xiatou.com/');
    }
}

(async () => {
    let ac_client = await AcClient.init("67403")

    ac_client.wss()
})()
