import {
  battleHashMap,
  bluePrinceBattle,
  cardMap,
  redPrinceBattle,
} from "./constants.js";
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
      previousCard: {},
      selectedCard: {},
    };

    if (!this.gameRooms[room].bluePlayer.id) {
      this.gameRooms[room].bluePlayer = { ...newPlayer, id: 1 };
      logger.info(`Blue Player ID: ${this.gameRooms[room].bluePlayer.id}`);

      this.sendIdCommand(ws, this.gameRooms[room].bluePlayer.id);
      return;
    }

    this.gameRooms[room].redPlayer = { ...newPlayer, id: 2 };

    this.sendIdCommand(ws, this.gameRooms[room].redPlayer.id);

    logger.info(`Red Player ID: ${this.gameRooms[room].redPlayer.id}`);
  }

  sendIdCommand(ws, id) {
    const idCommand = {
      type: "your-id",
      params: {
        id,
      },
    };

    ws.send(JSON.stringify(idCommand));
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
        selectedCard: cardMap[number],
      };

      ws.send(JSON.stringify(this.gameRooms[room].bluePlayer.selectedCard));
      logger.info(`Blue player selected card: ${cardMap[number].name}`);
      return;
    }

    this.gameRooms[room].redPlayer = {
      ...this.gameRooms[room].redPlayer,
      selectedCard: cardMap[number],
    };

    logger.info(`Red player selected card: ${cardMap[number].name}`);
    ws.send(JSON.stringify(this.gameRooms[room].redPlayer.selectedCard));

    // rooms[roomKey].forEach((ws) => ws.send(number))
  }

  removeCard(player) {
    player.cards = player.cards.filter(
      (cards) => cards !== player.selectedCard.force
    );
  }

  battleWithPrince(princeOpponentPlayer, princePlayer, princePlayerColor) {
    const oponnentCard = princeOpponentPlayer.selectedCard.name.toLowerCase();
    const hashPrinceBattle =
      princePlayerColor === "red" ? redPrinceBattle : bluePrinceBattle;

    this.setPreviousCard(princeOpponentPlayer, princePlayer);
    this.cleanSelectedCard(princeOpponentPlayer, princeOpponentPlayer);

    return hashPrinceBattle[oponnentCard] === undefined
      ? hashPrinceBattle["default"]
      : hashPrinceBattle[oponnentCard];
  }

  battleRound(bluePlayer, redPlayer) {
    this.removeCard(bluePlayer);
    this.removeCard(redPlayer);

    // logica imitador
    if (bluePlayer.selectedCard.name === "Imitador") {
      bluePlayer.selectedCard = redPlayer.previousCard;
    }

    // logica imitador
    if (redPlayer.selectedCard.name === "Imitador") {
      redPlayer.selectedCard = bluePlayer.previousCard;
    }

    // logica principe
    if (bluePlayer.selectedCard.name === "Principe") {
      this.battleWithPrince(redPlayer, bluePlayer, "blue")
    }

    // logica principe
    if (redPlayer.selectedCard.name === "Principe") {
      this.battleWithPrince(bluePlayer, redPlayer, "red")
    }

    // logica general
    if (bluePlayer.previousCard.name === "General") {
      bluePlayer.selectedCard.force += 2;
    }

    // logica general
    if (redPlayer.previousCard.name === "General") {
      redPlayer.selectedCard.force += 2;
    }

    // logica empate
    if (
      bluePlayer.selectedCard.name === "Musico" ||
      redPlayer.selectedCard.name === "Musico" ||
      bluePlayer.selectedCard.force === redPlayer.selectedCard.force
    ) {
      this.setPreviousCard(bluePlayer, redPlayer);
      this.cleanSelectedCard(bluePlayer, redPlayer);
      return "draw";
    }

    // logica do assassino
    if (
      bluePlayer.selectedCard.name === "Assassino" ||
      redPlayer.selectedCard.name === "Assassino"
    ) {
      const winner =
        bluePlayer.selectedCard.force < redPlayer.selectedCard.force
          ? "blue"
          : "red";

      this.setPreviousCard(bluePlayer, redPlayer);
      this.cleanSelectedCard(bluePlayer, redPlayer);
      return winner;
    }

    const battleKey = `${bluePlayer.selectedCard.force}-${redPlayer.selectedCard.force}`;

    this.setPreviousCard(bluePlayer, redPlayer);
    this.cleanSelectedCard(bluePlayer, redPlayer);

    return battleHashMap[battleKey];
  }

  setPreviousCard(playerOne, playerTwo) {
    playerOne.previousCard = playerOne.selectedCard;
    playerTwo.previousCard = playerTwo.selectedCard;
  }

  cleanSelectedCard(playerOne, playerTwo) {
    playerOne.selectedCard = {};
    playerTwo.selectedCard = {};
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

    if (
      Object.keys(bluePlayer.selectedCard).length === 0 ||
      Object.keys(redPlayer.selectedCard).length === 0
    ) {
      // logica espiao
      if (playerId === 1 && redPlayer.previousCard.name === "Espião") {
        this.showOpponentCard(roomPlayers, bluePlayer);
      }

      // logica espiao
      if (playerId === 2 && bluePlayer.previousCard.name === "Espião") {
        this.showOpponentCard(roomPlayers, redPlayer);
      }

      return;
    }

    const battleResult = this.battleRound(bluePlayer, redPlayer);

    

    const winnerHashTable = {
      blue: bluePlayer,
      red: redPlayer,
      draw: "draw",
    };

    this.handleBattleResult(winnerHashTable[battleResult], battleResult, room);

    const showRoundResult = {
      type: "show-round-result",
      params: {
        result: battleResult,
        bluePlayer: {
          points: bluePlayer.points,
          cards: bluePlayer.cards,
          roundCard: bluePlayer.previousCard.name,
        },
        redPlayer: {
          points: redPlayer.points,
          cards: redPlayer.cards,
          roundCard: redPlayer.previousCard.name,
        },
        activeDraws: room.activeDraws,
      },
    };

    roomPlayers.forEach((ws) => ws.send(JSON.stringify(showRoundResult)));
  }

  handleBattleResult(winner, battleResult, room) {
    if (battleResult === "draw") {
      room.activeDraws += 1;
      logger.info(`Increasing active draws. Active draws: ${room.activeDraws}`);
      return;
    }

    this.increasePlayerPoints(winner, room.activeDraws);
    room.activeDraws = 0;
    logger.info(
      `Increasing ${battleResult} player points with ${1 + room.activeDraws}`
    );
  }

  increasePlayerPoints(player, activeDraws) {
    const points = player.previousCard.name === "Embaixador" ? 2 : 1;
    player.points += points + activeDraws;
  }
}
