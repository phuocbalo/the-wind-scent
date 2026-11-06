import test from 'node:test';
import assert from 'node:assert/strict';
import { migrate, validate, newSave, exportText, importText, SAVE_VERSION } from '../src/save.js';

test('new save is valid and current version', () => {
  const s = newSave(1000);
  assert.ok(validate(s));
  assert.equal(s.version, SAVE_VERSION);
});

test('old save without version upgrades and keeps progress (N05)', () => {
  const old = { savedAt: 500, gameNow: 600, testCounter: 7 };
  const s = migrate(old);
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.testCounter, 7);
  assert.equal(s.gameNow, 600);
  assert.ok(validate(s));
});

test('save from a newer game version is refused, not damaged', () => {
  assert.throws(() => migrate({ version: SAVE_VERSION + 1, gameNow: 1, testCounter: 1 }), /save-too-new/);
});

test('export then import gives the same data (N04)', () => {
  const s = { ...newSave(1000), testCounter: 42 };
  const back = importText(exportText(s));
  assert.equal(back.testCounter, 42);
  assert.equal(back.gameNow, s.gameNow);
});

test('import rejects broken or foreign files', () => {
  assert.throws(() => importText('not json'), /not-json/);
  assert.throws(() => importText('{"hello":1}'), /not-our-file/);
});
