/*
 * @Date: 2020-09-12 16:54:29
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-14 13:57:31
 */
const tools = require("./tools")
var WebSocketClient = require('websocket').client;
const proto = require("./proto")
class AcClient {
    did
    visitorSt
    acSecurity
    userId
    liveId
    availiableTickets
    enterRoomAttach
    seqId = 0
    instanceId = 0
    sessionKey = ""
    headerSeqId = 1
    heartbeatSeqId = 1
    ticketIndex = 0
    retryCount = 0
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

    wss = async () => {

        var client = new WebSocketClient();

        client.on('connectFailed', function (error) {
            console.log('Connect Error: ' + error.toString());
        });

        client.on('connect', (connection) => {
            console.log('WebSocket Client Connected');
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
                console.log(message)
                proto.decodePackTest(message.binaryData, this.acSecurity)
            });
            let sendBytes = () => {

                if (connection.connected) {
                    this.seqId++
                    let buffer = proto.genRegisterPack(this.seqId, this.instanceId, this.userId, this.acSecurity, this.visitorSt)
                    //proto.decodePackTest(buffer, this.acSecurity)
                    //console.log(buffer.toString("base64"))
                    connection.sendBytes(buffer);
                }
            }
            sendBytes();
        });

        client.connect('wss://link.xiatou.com/');
    }
}

(async () => {
    let ac_client = await AcClient.init("3497134")

    ac_client.wss()
})()
