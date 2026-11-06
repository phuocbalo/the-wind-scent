import test from 'node:test';
import assert from 'node:assert/strict';
import { GameClock, resumeGameTime } from '../src/clock.js';

const H = 3600_000;

function fakeEnv(startWall) {
  const env = { wall: startWall, steady: 0 };
  env.now = () => env.wall;
  env.st = () => env.steady;
  env.pass = (ms) => { env.wall += ms; env.steady += ms; };
  return env;
}

test('new game starts at device time', () => {
  assert.equal(resumeGameTime(undefined, 1000), 1000);
});

test('normal reopen: game time catches up to device time', () => {
  assert.equal(resumeGameTime(10 * H, 18 * H), 18 * H);
});

test('clock turned back: game time does not go back (no loss)', () => {
  const c = new GameClock({ savedGameNow: 10 * H, now: () => 8 * H, steady: () => 0 });
  assert.equal(c.gameNow, 10 * H);
  assert.equal(c.clockWentBack, true);
});

test('clock back, play 1h, fix clock: no doubled time', () => {
  // Saved at real 10:00. Real time 10:05, device shows 08:00.
  const env = fakeEnv(8 * H);
  let c = new GameClock({ savedGameNow: 10 * H, now: env.now, steady: env.st });
  env.pass(1 * H); // play 1 hour; device shows 09:00, real is 11:05
  const saved = c.tick();
  assert.equal(saved, 11 * H);
  // Player fixes clock to real time 11:05 and reopens.
  c = new GameClock({ savedGameNow: saved, now: () => 11 * H + 5 * 60_000, steady: () => 0 });
  assert.equal(c.gameNow, 11 * H + 5 * 60_000); // matches real time, not 13:05
});

test('clock changed back while game is open keeps moving forward', () => {
  const env = fakeEnv(10 * H);
  const c = new GameClock({ savedGameNow: 10 * H, now: env.now, steady: env.st });
  env.wall -= 5 * H; // device clock set back 5 hours
  env.pass(60_000);
  assert.equal(c.tick(), 10 * H + 60_000);
});
