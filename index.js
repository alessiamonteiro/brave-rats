import { WebSocketServer } from "ws";
import { logger } from "./utils/log.util.js";
import RoomHandler from "./roomHandler.js";
import GameHandler from "./gameHandler.js";

const wss = new WebSocketServer({ port: 3000 });
const roomHandler = new RoomHandler();
const gameHandler = new GameHandler();
const MAX_CLIENTS = 2;

function onError(ws, error) {}

function onMessage(ws, data) {
  const { type, params } = JSON.parse(data);
  switch (type) {
    case "create":
      roomHandler.createRoom(ws);
      gameHandler.setGameRoom(roomHandler.rooms[ws.room], ws.room);
      gameHandler.setPlayer(ws);
      break;

    case "join":
      roomHandler.joinRoom(ws, params.code, MAX_CLIENTS);
      gameHandler.setPlayer(ws);
      break;

    case "leave":
      roomHandler.leaveRoom(ws);
      break;

    case "card":
      gameHandler.playCard(ws, params, ws.room);
      break;

    case "confirm-card":
      gameHandler.confirmCard(roomHandler.rooms[ws["room"]], ws["room"], params);
      break;

    default:
      logger.warn(`Type: ${type} unknown`);
      break;
  }
}

function onConnection(ws) {
  ws.on("message", (data) => onMessage(ws, data));
  ws.on("error", (error) => onError(ws, error));
  logger.info(`onConnection`);
}

wss.on("connection", (ws) => onConnection(ws));
