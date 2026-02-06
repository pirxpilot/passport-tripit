const test = require('node:test');
const assert = require('node:assert/strict');
const TripItStrategy = require('../lib/passport-tripit/strategy.js');

test('TripItStrategy', async (t) => {
  await t.test('strategy should be named tripit', () => {
    const strategy = new TripItStrategy({
      consumerKey: 'ABC123',
      consumerSecret: 'secret'
    }, function() {});

    assert.equal(strategy.name, 'tripit');
  });

  await t.test('strategy when loading user profile', async (t) => {
    const strategy = new TripItStrategy({
      consumerKey: 'ABC123',
      consumerSecret: 'secret'
    }, function() {});

    // mock
    strategy._oauth.get = function(url, token, tokenSecret, callback) {
      const body = '{ \
            "timestamp": "1322517396", \
            "num_bytes": "1240", \
            "Profile": { \
                "@attributes": { \
                    "ref": "XXxxXxxXX-xXNx_XXNNNXx" \
                }, \
                "ProfileEmailAddresses": { \
                    "ProfileEmailAddress": [{ \
                        "address": "jaredhanson@example.com", \
                        "is_auto_import": "false", \
                        "is_confirmed": "true", \
                        "is_primary": "true" \
                    }, \
                    { \
                        "address": "jaredhanson@example.net", \
                        "is_auto_import": "false", \
                        "is_confirmed": "true", \
                        "is_primary": "false" \
                    }] \
                }, \
                "is_client": "true", \
                "is_pro": "false", \
                "screen_name": "jaredhanson", \
                "public_display_name": "Jared Hanson", \
                "profile_url": "people\/jaredhanson", \
                "home_city": "Berkeley, CA", \
                "photo_url": "http:\/\/static.tripit.com\/uploads\/images\/6\/6\/9\/669XXXXXXXXXXXXX.jpg", \
                "activity_feed_url": "http:\/\/www.tripit.com\/feed\/activities\/private\/XXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\/activities.atom", \
                "alerts_feed_url": "http:\/\/www.tripit.com\/feed\/alerts\/private\/XXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\/alerts.atom", \
                "ical_url": "webcal:\/\/www.tripit.com\/feed\/ical\/private\/XXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\/tripit.ics" \
            } \
        }';

      callback(null, body, undefined);
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

  await t.test('strategy when loading user profile and encountering an error', async (t) => {
    const strategy = new TripItStrategy({
      consumerKey: 'ABC123',
      consumerSecret: 'secret'
    }, function() {});

    // mock
    strategy._oauth.get = function(url, token, tokenSecret, callback) {
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
