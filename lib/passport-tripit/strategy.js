/**
 * Module dependencies.
 */
const querystring = require('node:querystring');

const util = require('node:util');
const OAuthStrategy = require('passport-oauth1');
const InternalOAuthError = require('passport-oauth1').InternalOAuthError;

/**
 * `Strategy` constructor.
 *
 * The TripIt authentication strategy authenticates requests by delegating to
 * TripIt using the OAuth protocol.
 *
 * Applications must supply a `verify` callback which accepts a `token`,
 * `tokenSecret` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `consumerKey`     identifies client to TripIt
 *   - `consumerSecret`  secret used to establish ownership of the consumer key
 *   - `callbackURL`     URL to which TripIt will redirect the user after obtaining authorization
 *
 * Examples:
 *
 *     passport.use(new TripItStrategy({
 *         consumerKey: '123-456-789',
 *         consumerSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/tripit/callback'
 *       },
 *       function(token, tokenSecret, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.requestTokenURL = options.requestTokenURL || 'https://api.tripit.com/oauth/request_token';
  options.accessTokenURL = options.accessTokenURL || 'https://api.tripit.com/oauth/access_token';
  const params = { oauth_callback: options.callbackURL };
  options.userAuthorizationURL =
    options.userAuthorizationURL || `https://www.tripit.com/oauth/authorize?${querystring.stringify(params)}`;
  options.sessionKey = options.sessionKey || 'oauth:tripit';

  OAuthStrategy.call(this, options, verify);
  this.name = 'tripit';
}

/**
 * Inherit from `OAuthStrategy`.
 */
util.inherits(Strategy, OAuthStrategy);

/**
 * Retrieve user profile from TripIt.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `id`
 *   - `username`
 *   - `displayName`
 *
 * @param {String} token
 * @param {String} tokenSecret
 * @param {Object} params
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function (token, tokenSecret, _params, done) {
  this._oauth.get('https://api.tripit.com/v1/get/profile?format=json', token, tokenSecret, (err, body, _res) => {
    if (err) {
      return done(new InternalOAuthError('failed to fetch user profile', err));
    }

    try {
      const json = JSON.parse(body);

      const profile = { provider: 'tripit' };
      profile.id = json.Profile['@attributes'].ref;
      profile.username = json.Profile.screen_name;
      profile.displayName = json.Profile.public_display_name;
      profile.emails = json.Profile.ProfileEmailAddresses.ProfileEmailAddress;
      if (!Array.isArray(profile.emails)) {
        profile.emails = [profile.emails];
      }
      profile.emails = profile.emails.map(email => ({ value: email.address }));

      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch (e) {
      done(e);
    }
  });
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
