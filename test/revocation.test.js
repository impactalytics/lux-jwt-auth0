import jwt from 'jsonwebtoken';
import assert from 'assert';
import luxjwt from '../dist';
import UnauthorizedError from '../dist/errors/unauthorized-error';

describe('revoked JWTs', function () {
  let secret = 'shhhhhh';

  let revoked_id = '1234';

  let middleware = luxjwt({
    secret: secret,
    isRevoked: function (req, payload) {
      return payload.jti && payload.jti === revoked_id;
    }
  });

  it('should throw if isRevoked is not a function', async function () {
    let req = {};
    let res = {};
    let token = jwt.sign({jti: '1233', foo: 'bar'}, secret);

    req.headers = new Map([
      ['authorization', 'Bearer ' + token]
    ]);

    let e;

    try {
      await luxjwt({
        secret: secret,
        isRevoked: 'Not a function'
      })(req, res);
    } catch (err) {
      e = err;
    }

    assert.ok(e);
    assert.equal(e.message, 'Token revocation must be a function!');
  });

  it('should throw if token is revoked', async function () {
    let req = {};
    let res = {};
    let token = jwt.sign({jti: revoked_id, foo: 'bar'}, secret);

    req.headers = new Map([
      ['authorization', 'Bearer ' + token]
    ]);

    let e;

    try {
      await middleware(req, res);
    } catch (err) {
      e = err;
    }

    assert.ok(e);
    assert.equal(e.message, 'Token has been revoked');
  });

  it('should work if token is not revoked', async function () {
    let req = {};
    let res = {};
    let token = jwt.sign({jti: '1233', foo: 'bar'}, secret);

    req.headers = new Map([
      ['authorization', 'Bearer ' + token]
    ]);

    let e;

    try {
      await middleware(req, res);
    } catch (err) {
      e = err;
    }

    assert.ok(!e);
    assert.equal('bar', req.user.foo);
  });

  it('should throw if error occurs checking if token is revoked', async function () {
    let req = {};
    let res = {};
    let token = jwt.sign({jti: revoked_id, foo: 'bar'}, secret);

    req.headers = new Map([
      ['authorization', 'Bearer ' + token]
    ]);

    let e;

    try {
      await luxjwt({
        secret: secret,
        isRevoked: function (req, payload) {
          throw new Error('An error ocurred');
        }
      })(req, res);
    } catch (err) {
      e = err;
    }

    assert.ok(e);
    assert.equal(e.message, 'An error ocurred');
  });
});
