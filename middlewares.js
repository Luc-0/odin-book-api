const { isValidObjectId } = require('mongoose');
const jwt = require('jsonwebtoken');

exports.verifyToken = function (req, res, next) {
  const bearerHeader = req.headers['authorization'];

  if (!bearerHeader) {
    return res.status(400).json({
      msg: 'Token not found',
    });
  }

  const bearer = bearerHeader.split(' ');

  if (bearer.length != 2) {
    return res.status(400).json({
      msg: 'Invalid authorization header',
    });
  }

  const token = bearer[1];

  jwt.verify(token, process.env.SECRET_JWT, (err, result) => {
    if (err) {
      return res.status(403).json({
        msg: 'Invalid token',
      });
    }

    req.token = token;
    next();
  });
};

exports.checkIdFormat = function (param) {
  return function (req, res, next) {
    if (!isValidObjectId(req.params[param])) {
      return res.status(400).json({
        msg: `Invalid ${param}`,
        [param]: req.params[param],
      });
    }
    next();
  };
};
