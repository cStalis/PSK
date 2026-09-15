import { Game, TOTAL_SHOTS, isScore } from './domain';

const STORAGE_KEY = 'precision-shooting-petanque:v1';
type StorageState = { active: Game | null; completed: Game[] };

const emptyState = (): StorageState => ({ active: null, completed: [] });

export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageError';
  }
}

const isGame = (value: unknown): value is Game => {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<Game>;
  return typeof game.id === 'string' &&
    typeof game.playerName === 'string' &&
    typeof game.createdAt === 'string' &&
    (game.completedAt === null || typeof game.completedAt === 'string') &&
    Array.isArray(game.entries) &&
    game.entries.length === TOTAL_SHOTS &&
    game.entries.every((entry) =>
      entry && typeof entry.shot === 'number' && typeof entry.setup === 'number' &&
      (entry.value === null || isScore(entry.value))
    );
};

const parse = (raw: string | null): StorageState => {
  if (!raw) return emptyState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('Stored value is not an object.');
    const state = parsed as Partial<StorageState>;
    if (state.active !== null && state.active !== undefined && (!isGame(state.active) || Boolean(state.active.completedAt))) {
      throw new Error('Stored active game is invalid.');
    }
    if (state.completed !== undefined && (!Array.isArray(state.completed) || state.completed.some((game) => !isGame(game) || !game.completedAt))) {
      throw new Error('Stored completed games are invalid.');
    }
    return {
      active: state.active ?? null,
      completed: state.completed ?? [],
    };
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError('Unable to read the saved scorecards.', { cause: error });
  }
};

export const createRepository = (storage: Storage = window.localStorage) => {
  const read = (): StorageState => {
    try {
      return parse(storage.getItem(STORAGE_KEY));
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Unable to read the saved scorecards.', { cause: error });
    }
  };
  const write = (state: StorageState): void => {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      throw new StorageError('Unable to save the scorecard. Check available browser storage.', { cause: error });
    }
  };
  return {
    getActive: () => read().active,
    saveActive: (game: Game) => {
      const state = read();
      write({ ...state, active: game });
    },
    complete: (game: Game) => {
      const state = read();
      write({ active: null, completed: [game, ...state.completed.filter((item) => item.id !== game.id)] });
    },
    listCompleted: () => read().completed.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    getCompleted: (id: string) => read().completed.find((game) => game.id === id) ?? null,
    clearActive: () => {
      const state = read();
      write({ ...state, active: null });
    },
  };
};
