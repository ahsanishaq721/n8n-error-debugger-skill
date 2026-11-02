'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { extractErrorText } = require('./extract-error-text.js');

const load = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'error-items', name), 'utf8'));
const postgres = load('postgres.json');
const http = load('http-request.json');
const calendar = load('google-calendar.json');

test('Postgres: returns the database message, not the SQL', () => {
  assert.equal(extractErrorText(postgres), 'relation "missing_table" does not exist');
});

test('HTTP Request: returns error.message, which starts with the status code', () => {
  assert.match(extractErrorText(http), /^422 - /);
});

test('Google Calendar: error is itself the string', () => {
  assert.equal(extractErrorText(calendar), 'The resource you are requesting could not be found');
});

test('the naive extractor prints [object Object] for Postgres (why note 001 exists)', () => {
  const naive = (x) => String(x.error.message || x.error);
  assert.equal(naive(postgres), '[object Object]');
  assert.notEqual(naive(http), '[object Object]');
});

test('unknown shapes and empty input fall back instead of throwing', () => {
  assert.equal(extractErrorText({}), 'unknown error');
  assert.equal(extractErrorText(null), 'unknown error');
  assert.equal(extractErrorText(undefined), 'unknown error');
});

test('an error object with only a description still yields text', () => {
  assert.equal(extractErrorText({ error: { description: 'something broke' } }), 'something broke');
});

test('non-string fields are never turned into [object Object]', () => {
  const item = { message: 42, error: { message: { nested: true }, description: 'fallback' } };
  assert.equal(extractErrorText(item), 'fallback');
});
