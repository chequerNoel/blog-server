const url = require('url');

class Oauth {
  constructor() {
    this.strategires = {};
  }

  use(name, strategy) {
    if (!name) throw new Error('Authentication strategies must have a name');
    if (!strategy) {
      /* eslint-disable */
      strategy = name;
      name = strategy.name;
      /* eslint-enable */
    }
    this.strategires[name] = strategy;
    return this;
  }

  authenticate(name, { failureUrl, successUrl }) {
    return async (req, res, next) => {
      const strategy = this.strategires[name];
      const { callbackURL } = strategy;
      const { error, code } = req.query;
      const originalURL = url.format({
        protocol: req.protocol,
        host: req.get('host'),
      });
      const redirectURI = url.resolve(originalURL, callbackURL);

      const verified = (err, user) => {
        if (err && failureUrl) {
          return res.redirect(failureUrl);
        }
        if (err) {
          res.locals.message = err.message;
          return next();
        }
        if (user && successUrl) return res.redirect(successUrl);
        req.user = user;
        return next();
      };

      if (error) return verified({ message: req.query.error_description });
      if (!code) {
        const authorizeEndPoint = strategy.authorizeEndPoint(redirectURI);
        return res.redirect(authorizeEndPoint);
      }
      try {
        const accessToken = await strategy.getOauthAccessToken(code, redirectURI);
        const { data } = await strategy.getUserProfile(accessToken);
        return strategy.verify(accessToken, data, verified);
      } catch (err) {
        return verified(err);
      }
    };
  }
}

module.exports = new Oauth();
