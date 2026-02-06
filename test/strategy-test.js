const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const TripItStrategy = require('../lib/passport-tripit/strategy.js');

test('TripItStrategy', async t => {
  await t.test('strategy should be named tripit', () => {
    const strategy = new TripItStrategy(
      {
        consumerKey: 'ABC123',
        consumerSecret: 'secret'
      },
      () => {}
    );

    assert.equal(strategy.name, 'tripit');
  });

  await t.test('strategy when loading user profile', async t => {
    const strategy = new TripItStrategy(
      {
        consumerKey: 'ABC123',
        consumerSecret: 'secret'
      },
      () => {}
    );

    // mock
    strategy._oauth.get = (_url, _token, _tokenSecret, callback) => {
      fs.readFile(path.join(__dirname, 'fixtures', 'response.json'), 'utf-8', callback);
    };

    await t.test('when told to load user profile', async () => {
      return new Promise((resolve, reject) => {
        function done(err, profile) {
          try {
            assert.equal(err, null);
            assert.equal(profile.provider, 'tripit');
            assert.equal(profile.id, 'XXxxXxxXX-xXNx_XXNNNXx');
            assert.equal(profile.username, 'jaredhanson');
            assert.equal(profile.displayName, 'Jared Hanson');
            assert.equal(profile.emails.length, 2);
            assert.deepEqual(profile.emails[0], { value: 'jaredhanson@example.com' });
            assert.deepEqual(profile.emails[1], { value: 'jaredhanson@example.net' });
            assert.equal(typeof profile._raw, 'string');
            assert.equal(typeof profile._json, 'object');
            resolve();
          } catch (e) {
            reject(e);
          }
        }

        process.nextTick(() => {
          strategy.userProfile('token', 'token-secret', {}, done);
        });
      });
    });
  });

  await t.test('strategy when loading user profile and encountering an error', async t => {
    const strategy = new TripItStrategy(
      {
        consumerKey: 'ABC123',
        consumerSecret: 'secret'
      },
      () => {}
    );

    // mock
    strategy._oauth.get = (_url, _token, _tokenSecret, callback) => {
      callback(new Error('something went wrong'));
    };

    await t.test('when told to load user profile', async () => {
      return new Promise((resolve, reject) => {
        function done(err, profile) {
          try {
            assert.notEqual(err, null);
            assert.equal(err.constructor.name, 'InternalOAuthError');
            assert.equal(profile, undefined);
            resolve();
          } catch (e) {
            reject(e);
          }
        }

        process.nextTick(() => {
          strategy.userProfile('token', 'token-secret', {}, done);
        });
      });
    });
  });
});
