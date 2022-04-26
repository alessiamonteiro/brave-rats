import { logger } from "./utils/log.util.js";

export default class RoomHandler {
  constructor() {
    this.rooms = {}
  }
  
  createRoom(ws) {
    try {
      const roomKey = this.genKey(5);
      this.rooms[roomKey] = [ws];
      ws["room"] = roomKey;
      this.getGeneralInformation(ws);
    } catch (error) {
      logger.info(`Error creating room: ${error}`);
    }
  }

  joinRoom(ws, roomKey, max_clients) {
    try {
      if (!Object.keys(this.rooms).includes(roomKey)) {
        logger.warn(`Room: ${roomKey} does not exist!`);
        return;
      }

      if (this.rooms[roomKey].length >= max_clients) {
        logger.warn(`Room: ${roomKey} is full`);
        return;
      }

      this.rooms[roomKey].push(ws);
      ws["room"] = roomKey;
      this.getGeneralInformation(ws);

      if (this.rooms[roomKey].length === max_clients) {
        const readyToPlayCommand = {
          type: "ready-to-play",
        };

        this.rooms[roomKey].forEach((ws) => ws.send(JSON.stringify(readyToPlayCommand)));
      }
    } catch (error) {
      logger.info(`Error joining room: ${error}`);
    }
  }

  genKey(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return result;
  }

  leaveRoom(ws) {
    try {
      const room = ws["room"];
      this.rooms[room] = this.rooms[room].filter((so) => so !== ws);
      ws["room"] = undefined;

      if (this.rooms[room].length == 0) {
        logger.info("cheguei");
        this.close(room);
      }
    } catch (error) {
      logger.error(`error leaving room: ${error}`);
    }
  }

  close(room) {
    const filtered = Object.entries(this.rooms).filter(
      ([key, value]) => key !== room
    );
    this.rooms = Object.fromEntries(filtered);
  }

  getGeneralInformation(ws) {
    let obj;
    if (ws["room"] !== undefined) {
      obj = {
        type: "info",
        params: {
          room: ws["room"],
          "no-clients": this.rooms[ws["room"]].length,
        },
      };
    } else {
      obj = {
        type: "info",
        params: {
          room: "no room",
        },
      };
    }

    ws.send(JSON.stringify(obj));
  }
}
