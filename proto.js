/*
 * @Date: 2020-09-12 19:04:27
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-14 01:11:12
 */


const ProtoBufJs = require("protobufjs");
const acConfig = require("./config/config.json")
const ROOT = ProtoBufJs.Root.fromJSON(require("./protos.bundle.json"));
const crypto = require('crypto');
const EncryptionMode = ROOT.lookupEnum("AcFunDanmu.EncryptionMode")

let base = {
    genCommand: (command, msg, ticket, liveId) => {
        const ZtLiveCsCmd = ROOT.lookupType("AcFunDanmu.ZtLiveCsCmd")
        let payload = {
            cmdType: command,
            ticket: ticket,
            liveId: liveId,
            payload: msg,
        }
        let ztLiveCsCmd = ZtLiveCsCmd.create(payload)
        return ZtLiveCsCmd.encode(ztLiveCsCmd).finish()
    },
    genPayload: (seqId, retryCount, command, msg) => {
        const UpstreamPayload = ROOT.lookupType("AcFunDanmu.UpstreamPayload")
        let payload = {
            command: command,
            payloadData: msg,
            seqId: seqId,
            retryCount: retryCount,
            subBiz: acConfig.kuaishou.subBiz
        }
        let upstreamPayload = UpstreamPayload.create(payload)
        let buffer = UpstreamPayload.encode(upstreamPayload).finish()
        return buffer
    },
    /**
     * @argument key {string}
     */
    genHeader: (seqId, instanceId, uid, length, encryptionMode = EncryptionMode.values.kEncryptionSessionKey, key) => {
        const PacketHeader = ROOT.lookupType("AcFunDanmu.PacketHeader")
        let keybuffer = Buffer.from(key)
        let payload = {
            flags: null,
            encodingType: null,
            tokenInfo: null,
            features: [],
            appId: acConfig.app_id,
            uid: uid,
            instanceId: instanceId,
            decodedPayloadLen: length,
            encryptionMode: encryptionMode,
            kpn: acConfig.kuaishou.kpn,
            seqId: seqId
        }
        if (encryptionMode === EncryptionMode.values.kEncryptionServiceToken)
            payload.tokenInfo = { tokenType: 1, token: keybuffer }
        let packetHeader = PacketHeader.create(payload)
        let buffer = PacketHeader.encode(packetHeader).finish()
        // console.log("header object")
        // console.log(buffer)
        // console.log(PacketHeader.decode(buffer))
        return buffer
    },
    genRegister: (instanceId, uid, deviceId) => {
        const RegisterRequest = ROOT.lookupType("AcFunDanmu.RegisterRequest")
        const PlatformType = ROOT.lookupEnum("AcFunDanmu.DeviceInfo.PlatformType")
        const PresenceStatus = ROOT.lookupEnum("AcFunDanmu.RegisterRequest.PresenceStatus")
        const ActiveStatus = ROOT.lookupEnum("AcFunDanmu.RegisterRequest.ActiveStatus")
        let payload = {
            appInfo: {
                appName: acConfig.app_name,
                sdkVersion: acConfig.sdk_version
            },
            deviceInfo: {
                platformType: PlatformType.values.H5,
                deviceModel: "h5",
                deviceId: deviceId,
                imeiMd5: null
            },
            presenceStatus: PresenceStatus.values.kPresenceOnline,
            appActiveStatus: ActiveStatus.values.kAppInForeground,
            instanceId: instanceId,
            ztCommonInfo: {
                kpn: acConfig.kuaishou.kpn,
                kpf: acConfig.kuaishou.kpf,
                uid: uid,
                did: deviceId
            }
        }
        let register = RegisterRequest.create(payload)
        let buffer = RegisterRequest.encode(register).finish()
        // console.log("register object")
        // console.log(RegisterRequest.decode(buffer))
        return buffer
    },
    encode: (header, body, key) => {
        // console.log(UpstreamPayload.decode(body))
         console.log(body.length)
        const iv = crypto.randomBytes(16)
        //console.log(iv)
        let cipher = crypto.createCipheriv("aes-192-cbc", key, iv)
        let encryptedWithoutFinal = cipher.update(body)
        let finalEn = cipher.final()
        let encrypted = Buffer.concat([encryptedWithoutFinal, finalEn])
        let headerSize = header.length
        let bodySize = encrypted.length
        // console.log(bodySize)
        let s1 = Buffer.from([0xAB, 0xCD, 0x00, 0x01])
        let s2 = Buffer.alloc(4)
        let s3 = Buffer.alloc(4)
        s2.writeInt32BE(headerSize)
        s3.writeInt32BE(bodySize)
        // console.log(header.toString("base64"))
        // console.log(iv.toString("base64"))
        // console.log(encrypted.toString("base64"))
        // console.log(ss.toString("base64"))
        let r = Buffer.concat([s1, s2, s3, header, iv, encrypted])
        //console.log(r.slice(12 + headerSize, 28 + headerSize))
        // console.log(r.slice(28 + headerSize, r.length))
        // console.log(encrypted)
        return r
    }
}

module.exports = {
    genRegisterPack: (deviceId, seqId, instanceId, uid, key) => {
        // console.log(deviceId)
        // console.log(seqId)
        // console.log(instanceId)
        // console.log(uid)
        // console.log(key)
        let register = base.genRegister(instanceId, uid, deviceId)
        let registerBody = base.genPayload(seqId, 1, "Basic.Register", register)
        let bodySize = registerBody.length
        return base.encode(base.genHeader(seqId, instanceId, uid, bodySize, EncryptionMode.values.kEncryptionServiceToken, key),
            registerBody, key)
    },
    /**
     * @argument buffer {Buffer}
     */
    decodePackTest: (buffer) => {
        const UpstreamPayload = ROOT.lookupType("AcFunDanmu.UpstreamPayload")
        const PacketHeader = ROOT.lookupType("AcFunDanmu.PacketHeader")
        const RegisterRequest = ROOT.lookupType("AcFunDanmu.RegisterRequest")
        let headersize = buffer.readInt32BE(4)
        let header = buffer.slice(12, 12 + headersize)
        let headerDecode = PacketHeader.decode(header)
        console.log(headerDecode)
        let key = headerDecode.tokenInfo.token.toString()
        let ivBuffer = buffer.slice(12 + headersize, 28 + headersize)
        let bodyBuffer = buffer.slice(28 + headersize, buffer.length)
        let decipher = crypto.createDecipheriv("aes-192-cbc", key, ivBuffer)
        let decryptedWithoutFinal = decipher.update(bodyBuffer)
        let finalDe = decipher.final()
        let decrypted = Buffer.concat([decryptedWithoutFinal, finalDe])
        let payload = UpstreamPayload.decode(decrypted)
        console.log(payload)
        let rr = RegisterRequest.decode(payload.payloadData)
        console.log(rr)
    }
}


