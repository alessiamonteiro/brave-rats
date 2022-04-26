export const cardMap = {
  0: {
    name: "Musico",
    force: 0,
    power: "Esta rodada termina em suspensao",
  },

  1: {
    name: "Princesa",
    force: 1,
    power: "Se seu oponente jogar o príncipe você automaticamente vence o jogo",
  },

  2: {
    name: "Espião",
    force: 2,
    power: "Na próxima rodada você a carta do seu oponente",
  },

  3: {
    name: "Assassino",
    force: 3,
    power: "A menor força vence",
  },

  4: {
    name: "Embaixador",
    force: 4,
    power: "Se vencer com esta carta conta como duas vitórias",
  },

  5: {
    name: "Imitador",
    force: 5,
    power: "Copia a carta jogada pelo oponente na rodada anterior",
  },

  6: {
    name: "General",
    force: 6,
    power: "A sua carta da próxima rodada recebe mais dois de força",
  },

  7: {
    name: "Príncipe",
    force: 7,
    power: "Vence a rodada exceto contra o musico e a princesa",
  },
};

export const battleHashMap = {
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

export const bluePrinceBattle = {
  musico: "draw",
  princesa: "red won",
  default: "blue",
};

export const redPrinceBattle = {
  musico: "draw",
  princesa: "blue won",
  default: "red",
};
