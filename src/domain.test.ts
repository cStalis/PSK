import { describe, expect, it } from 'vitest';
import { createGame, currentShot, isComplete, totalScore, updateScore } from './domain';

describe('game scoring', () => {
  it('creates twenty empty shots', () => expect(createGame('Ada').entries).toHaveLength(20));
  it('calculates a total and completion', () => {
    let game = createGame('Ada');
    for (let shot = 0; shot < 20; shot++) game = updateScore(game, shot, 5);
    expect(totalScore(game)).toBe(100);
    expect(isComplete(game)).toBe(true);
  });

  it('finds the first unscored shot and rejects invalid positions', () => {
    let game = createGame('Ada');
    game = updateScore(game, 0, 3);
    expect(currentShot(game)).toBe(1);
    expect(() => updateScore(game, 20, 1)).toThrow(RangeError);
  });
});
