import { describe, expect, it } from 'vitest';
import { createGame, updateScore } from './domain';
import { createRepository, StorageError } from './storage';

const createStorage = (initial: string | null = null): Storage => {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; },
    clear: () => { value = null; },
    key: () => null,
    length: 0,
  };
};

describe('scorecard storage', () => {
  it('persists active and completed games', () => {
    const repository = createRepository(createStorage());
    let game = createGame('Ada');
    game = updateScore(game, 0, 5);
    repository.saveActive(game);
    expect(repository.getActive()?.entries[0].value).toBe(5);

    const completed = { ...game, completedAt: new Date().toISOString() };
    repository.complete(completed);
    expect(repository.getActive()).toBeNull();
    expect(repository.getCompleted(game.id)?.playerName).toBe('Ada');
  });

  it('raises a storage error for malformed saved data', () => {
    const repository = createRepository(createStorage('{invalid'));
    expect(() => repository.getActive()).toThrow(StorageError);
  });
});
