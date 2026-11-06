// Forward-only game clock (N06).
// Game time never moves backwards and never jumps ahead because the device
// clock was turned back and then fixed.
//
// Rule:
//   - When the game opens:   gameNow = max(savedGameNow, deviceNow)
//   - While the game is open: gameNow advances with a steady timer
//     (performance.now), and also catches up if the device clock is ahead.
//
// Example: saved at 10:00. Player turns the clock back to 08:00 and plays
// for 1 hour -> game time is 11:00 (never 08:00, nothing lost). Player fixes
// the clock to the real time 11:05 -> game time is 11:05 (not 13:05, nothing
// doubled).

export function resumeGameTime(savedGameNow, deviceNow) {
  if (typeof savedGameNow !== 'number' || !isFinite(savedGameNow)) return deviceNow;
  return Math.max(savedGameNow, deviceNow);
}

export function advanceGameTime(gameNow, steadyElapsedMs, deviceNow) {
  const stepped = gameNow + Math.max(0, steadyElapsedMs);
  return Math.max(stepped, deviceNow);
}

export class GameClock {
  constructor({ savedGameNow, now = () => Date.now(), steady = () => performance.now() } = {}) {
    this._now = now;
    this._steady = steady;
    this.gameNow = resumeGameTime(savedGameNow, now());
    this._lastSteady = steady();
    this.clockWentBack = typeof savedGameNow === 'number' && now() < savedGameNow;
  }

  // Call often (e.g. every frame or every second). Returns current game time in ms.
  tick() {
    const s = this._steady();
    this.gameNow = advanceGameTime(this.gameNow, s - this._lastSteady, this._now());
    this._lastSteady = s;
    return this.gameNow;
  }

  // Game time as a Date (for day/night later).
  date() {
    return new Date(this.gameNow);
  }
}
