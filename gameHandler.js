import { logger } from "./utils/log.util.js";

export default class GameHandler {
  constructor() {
    this.gameRooms = [];
  }

  setGameRoom(room, roomKey) {
    this.gameRooms[roomKey] = {
      ...room,
      bluePlayer: {},
      redPlayer: {},
      activeDraws: 0,
    };
  }

  setPlayer(ws) {
    const { room } = ws;

    const newPlayer = {
      points: 0,
      webSocket: ws,
      cards: [0, 1, 2, 3, 4, 5, 6, 7],
    };

    if (!this.gameRooms[room].bluePlayer.id) {
      this.gameRooms[room].bluePlayer = { ...newPlayer, id: 1 };
      logger.info(`Blue Player ID: ${this.gameRooms[room].bluePlayer.id}`);
      const idCommand = {
        type: "your-id",
        params: {
          id: this.gameRooms[room].bluePlayer.id,
        },
      };

      ws.send(JSON.stringify(idCommand));
      return;
    }

    this.gameRooms[room].redPlayer = { ...newPlayer, id: 2 };
    const idCommand = {
      type: "your-id",
      params: {
        id: this.gameRooms[room].redPlayer.id,
      },
    };

    ws.send(JSON.stringify(idCommand));
    logger.info(`Red Player ID: ${this.gameRooms[room].redPlayer.id}`);
  }

  getPlayerById(id, roomKey) {
    if (this.gameRooms[roomKey].bluePlayer.id === id) {
      return "blue";
    }

    if (this.gameRooms[roomKey].redPlayer.id === id) {
      return "red";
    }

    logger.warn(`Player: ${id} not found`);
  }

  playCard(ws, params) {
    const { number, playerId } = params;
    const { room } = ws;

    const player = this.getPlayerById(playerId, room);

    if (player === "blue") {
      this.gameRooms[room].bluePlayer = {
        ...this.gameRooms[room].bluePlayer,
        selectedCard: number,
      };

      ws.send(JSON.stringify(this.gameRooms[room].bluePlayer.selectedCard));
      logger.info(`Blue player selected card: ${number}`);
      return;
    }

    this.gameRooms[room].redPlayer = {
      ...this.gameRooms[room].redPlayer,
      selectedCard: number,
    };

    logger.info(`Red player selected card: ${number}`);
    ws.send(JSON.stringify(this.gameRooms[room].redPlayer.selectedCard));

    // rooms[roomKey].forEach((ws) => ws.send(number))
  }

  removeCard(player) {
    player.cards = player.cards.filter(
      (cards) => cards !== player.selectedCard
    );
  }

  battleRound(bluePlayer, redPlayer) {
    this.removeCard(bluePlayer);
    this.removeCard(redPlayer);

    let bluePlayerCard = bluePlayer.selectedCard;
    let redPlayerCard = redPlayer.selectedCard;

    // logica imitador
    if (bluePlayerCard === 5) {
      bluePlayer.selectedCard = redPlayer.previousCard;
    }

    // logica imitador
    if (redPlayerCard === 5) {
      redPlayer.selectedCard = bluePlayer.previousCard;
    }

    // logica principe
    if (bluePlayerCard === 7) {
      if (redPlayer.selectedCard === 0) return "draw";
      if (redPlayer.selectedCard === 1) return "red won";
      return "blue";
    }

    // logica principe
    if (redPlayerCard === 7) {
      if (bluePlayer.selectedCard === 0) return "draw";
      if (bluePlayer.selectedCard === 1) return "blue won";
      return "red";
    }

    // logica general
    if (bluePlayer.previousCard === 6) {
      bluePlayerCard += 2;
    }

    // logica general
    if (redPlayer.previousCard === 6) {
      redPlayerCard += 2;
    }

    // logica empate
    if (
      bluePlayer.selectedCard === 0 ||
      redPlayer.selectedCard === 0 ||
      bluePlayerCard === redPlayerCard
    ) {
      this.setPreviousCard(bluePlayer, redPlayer);
      this.cleanSelectedCard(bluePlayer, redPlayer);
      logger.info(`draw`);
      return "draw";
    }

    const battleKey = `${bluePlayerCard}-${redPlayerCard}`;
    // implementar logica general - player.previousCard
    // implementar logica imitador - OK?
    // implementar logica contar empates

    const battleHashMap = {
      // princesa
      "1-2": "red",
      "1-3": "blue",
      "1-4": "red",
      "1-5": "red",
      "1-6": "red",

      "2-1": "blue",
      "3-1": "red",
      "4-1": "blue",
      "5-1": "blue",
      "6-1": "blue",

      // espiao
      "2-3": "blue",
      "2-4": "red",
      "2-5": "red",
      "2-6": "red",

      "3-2": "red",
      "4-2": "blue",
      "5-2": "blue",
      "6-2": "blue",

      // assassino
      "3-4": "blue",
      "3-5": "blue",
      "3-6": "blue",

      "4-3": "red",
      "5-3": "red",
      "6-3": "red",

      // embaixador
      "4-5": "red",
      "4-6": "red",

      "5-4": "blue",
      "6-4": "blue",

      //imitador
      "5-6": "red",

      "6-5": "blue",
    };

    this.setPreviousCard(bluePlayer, redPlayer);
    this.cleanSelectedCard(bluePlayer, redPlayer);

    return battleHashMap[battleKey];
  }

  setPreviousCard(bluePlayer, redPlayer) {
    bluePlayer.previousCard = bluePlayer.selectedCard;
    redPlayer.previousCard = redPlayer.selectedCard;
  }

  cleanSelectedCard(bluePlayer, redPlayer) {
    bluePlayer.selectedCard = undefined;
    redPlayer.selectedCard = undefined;
  }

  showOpponentCard(roomPlayers, player) {
    const showOpponentCardCommand = {
      type: "show-opponent-card",
      params: {
        card: player.selectedCard,
      },
    };

    roomPlayers.forEach((roomPlayer) =>
      roomPlayer.send(JSON.stringify(showOpponentCardCommand))
    );
  }

  confirmCard(roomPlayers, roomKey, params) {
    const { playerId } = params;
    const room = this.gameRooms[roomKey];
    const { bluePlayer, redPlayer } = room;

    logger.info(
      `blueCard: ${bluePlayer.selectedCard}, redCard: ${redPlayer.selectedCard}`
    );

    if (
      bluePlayer.selectedCard === undefined ||
      redPlayer.selectedCard === undefined
    ) {
      // logica espiao
      if (playerId === 1 && redPlayer.previousCard === 2) {
        this.showOpponentCard(roomPlayers, bluePlayer);
      }

      // logica espiao
      if (playerId === 2 && bluePlayer.previousCard === 2) {
        this.showOpponentCard(roomPlayers, redPlayer);
      }

      return;
    }

    const battleResult = this.battleRound(bluePlayer, redPlayer);

    logger.info(
      `The round is ${bluePlayer.selectedCard} vs ${redPlayer.selectedCard}`
    );

    if (battleResult === "draw") {
      room.activeDraws += 1;
      logger.info(`Increasing active draws. Active draws: ${room.activeDraws}`);
    }

    if (battleResult === "blue") {
      this.increasePlayerPoints(bluePlayer, room.activeDraws);
      room.activeDraws = 0;
      logger.info(`Increasing red player points with ${1 + room.activeDraws}`);
    }

    if (battleResult === "red") {
      this.increasePlayerPoints(redPlayer, room.activeDraws);
      room.activeDraws = 0;
      logger.info(`Increasing blue player points with ${1 + room.activeDraws}`);
    }

    const showRoundResult = {
      type: "show-round-result",
      params: {
        result: battleResult,
        bluePlayer: {
          points: bluePlayer.points,
          cards: bluePlayer.cards,
          roundCard: bluePlayer.previousCard
        },
        redPlayer: {
          points: redPlayer.points,
          cards: redPlayer.cards,
          roundCard: redPlayer.previousCard
        },
        activeDraws: room.activeDraws,
      },
    };

    roomPlayers.forEach((ws) => ws.send(JSON.stringify(showRoundResult)));
  }

  increasePlayerPoints(player, activeDraws) {
    const points = player.previousCard === 4 ? 2 : 1;
    player.points += points + activeDraws;
  }
}
