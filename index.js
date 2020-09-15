"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
 * @Date: 2020-09-12 16:54:29
 * @LastEditors: kanoyami
 * @LastEditTime: 2020-09-15 23:38:01
 */
var ProtoBufJs = require("protobufjs");

var ROOT = ProtoBufJs.Root.fromJSON(require("./protos.bundle.json"));

var tools = require("./tools");

var commandHandler = require("./handler/command.handler");

var WebSocketClient = require("websocket").client;

var proto = require("./proto");

var events = require("events");

var AcClient = function AcClient(did, visitorSt, acSecurity, userId, liveId, availiableTickets, enterRoomAttach) {
  var _this = this;

  _classCallCheck(this, AcClient);

  _defineProperty(this, "did", void 0);

  _defineProperty(this, "visitorSt", void 0);

  _defineProperty(this, "acSecurity", void 0);

  _defineProperty(this, "userId", void 0);

  _defineProperty(this, "liveId", void 0);

  _defineProperty(this, "availiableTickets", void 0);

  _defineProperty(this, "enterRoomAttach", void 0);

  _defineProperty(this, "connection", void 0);

  _defineProperty(this, "seqId", 1);

  _defineProperty(this, "instanceId", 0);

  _defineProperty(this, "sessionKey", "");

  _defineProperty(this, "headerSeqId", 1);

  _defineProperty(this, "heartbeatSeqId", 1);

  _defineProperty(this, "ticketIndex", 0);

  _defineProperty(this, "retryCount", 0);

  _defineProperty(this, "timer", void 0);

  _defineProperty(this, "sendBytes", function (buffer) {
    if (_this.connection.connected) {
      _this.connection.sendBytes(buffer);

      _this.seqId++;
    } else console.log("Ws closed");
  });

  _defineProperty(this, "decodeProcess", /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(buffer) {
      var DownstreamPayload, header, decrypted, payload;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              DownstreamPayload = ROOT.lookupType("DownstreamPayload");
              header = proto.decodeHeader(buffer);

              if (!(header.encryptionMode == 1)) {
                _context.next = 6;
                break;
              }

              _this.processRegisterResponse(buffer);

              _context.next = 10;
              break;

            case 6:
              decrypted = proto.decrypt(buffer, _this.sessionKey);
              payload = DownstreamPayload.decode(decrypted);
              _context.next = 10;
              return commandHandler(payload, _this);

            case 10:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());

  _defineProperty(this, "processRegisterResponse", function (buffer) {
    var DownstreamPayload = ROOT.lookupType("DownstreamPayload");
    var RegisterResponse = ROOT.lookupType("RegisterResponse");
    var decrypted = proto.decrypt(buffer, _this.acSecurity);
    var payload = DownstreamPayload.decode(decrypted);
    var rr = RegisterResponse.decode(payload.payloadData);
    _this.instanceId = rr.instanceId;
    _this.sessionKey = rr.sessKey.toString("base64");

    _this.sendBytes(proto.genKeepAlivePack(_this.seqId, _this.instanceId, _this.userId, _this.sessionKey));

    _this.sendBytes(proto.genEnterRoomPack(_this.seqId, _this.instanceId, _this.userId, _this.sessionKey, _this.enterRoomAttach, _this.availiableTickets[_this.ticketIndex], _this.liveId));
  });

  _defineProperty(this, "wsStart", function () {
    var client = new WebSocketClient();
    client.on("connectFailed", function (error) {
      console.log("Connect Error: " + error.toString());
    });
    client.on("connect", function (connection) {
      console.log("WebSocket Client Connected");
      _this.connection = connection;
      var register = proto.genRegisterPack(_this.seqId, _this.instanceId, _this.userId, _this.acSecurity, _this.visitorSt);

      _this.sendBytes(register);

      connection.on("error", function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on("close", function () {
        console.log("fvck!");
        _this.seqId = 1;
        setTimeout(function () {
          console.log("连接失败，正在重试");
          client.connect("wss://link.xiatou.com/");
        }, 5000);
      });
      connection.on("message", function (message) {
        //console.log(message)
        _this.decodeProcess(message.binaryData);
      });
    });
    client.connect("wss://link.xiatou.com/");
  });

  events.EventEmitter.call(this);
  this.did = did;
  this.visitorSt = visitorSt;
  this.acSecurity = acSecurity;
  this.userId = userId;
  this.liveId = liveId;
  this.availiableTickets = availiableTickets;
  this.enterRoomAttach = enterRoomAttach;
};

_defineProperty(AcClient, "init", /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(author_id) {
    var did, login_info, visitorSt, userId, acSecurity, live_info, availiableTickets, enterRoomAttach, liveId;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return tools.getDid();

          case 2:
            did = _context2.sent;
            _context2.next = 5;
            return tools.visitorlogin(AcClient.did);

          case 5:
            login_info = _context2.sent;
            visitorSt = login_info.visitorSt;
            userId = login_info.userId;
            acSecurity = login_info.acSecurity;
            _context2.next = 11;
            return tools.startPlayInfoByVisitor(did, userId, visitorSt, author_id)["catch"](function () {
              console.error("直播间可能煤油开播");
            });

          case 11:
            live_info = _context2.sent;
            availiableTickets = live_info["availableTickets"];
            enterRoomAttach = live_info.enterRoomAttach;
            liveId = live_info.liveId;
            return _context2.abrupt("return", new AcClient(did, visitorSt, acSecurity, userId, liveId, availiableTickets, enterRoomAttach));

          case 16:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x2) {
    return _ref2.apply(this, arguments);
  };
}());

AcClient.prototype.__proto__ = events.EventEmitter.prototype;
module.exports = AcClient;

