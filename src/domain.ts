export const TARGET_SETUP_COUNT = 5;
export const SHOTS_PER_SETUP = 4;
export const TOTAL_SHOTS = TARGET_SETUP_COUNT * SHOTS_PER_SETUP;
export const VALID_SCORES = [0, 1, 3, 5] as const;
export type Score = (typeof VALID_SCORES)[number];

export type ScoreEntry = {
  shot: number;
  setup: number;
  value: Score | null;
};

export type Game = {
  id: string;
  playerName: string;
  createdAt: string;
  completedAt: string | null;
  entries: ScoreEntry[];
};

export const createEntries = (): ScoreEntry[] =>
  Array.from({ length: TOTAL_SHOTS }, (_, index) => ({
    shot: index,
    setup: Math.floor(index / SHOTS_PER_SETUP),
    value: null,
  }));

export const createGame = (playerName: string, now = new Date()): Game => ({
  id: crypto.randomUUID(),
  playerName: playerName.trim(),
  createdAt: now.toISOString(),
  completedAt: null,
  entries: createEntries(),
});

export const isScore = (value: unknown): value is Score =>
  typeof value === 'number' && VALID_SCORES.includes(value as Score);

export const totalScore = (game: Game): number =>
  game.entries.reduce((total, entry) => total + (entry.value ?? 0), 0);

export const isComplete = (game: Game): boolean =>
  game.entries.length === TOTAL_SHOTS && game.entries.every((entry) => isScore(entry.value));

export const updateScore = (game: Game, shot: number, value: Score): Game => {
  if (shot < 0 || shot >= TOTAL_SHOTS) throw new RangeError('Shot is outside the game.');
  return {
    ...game,
    entries: game.entries.map((entry) => (entry.shot === shot ? { ...entry, value } : entry)),
  };
};

export const currentShot = (game: Game): number => {
  const firstUnscored = game.entries.findIndex((entry) => entry.value === null);
  return firstUnscored === -1 ? TOTAL_SHOTS - 1 : firstUnscored;
};
