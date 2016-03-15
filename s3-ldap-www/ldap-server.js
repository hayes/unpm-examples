var ldap = require('ldapjs')

var SUFFIX = 'ou=example-org'

createServer().listen(8321)

function createServer () {
  var server = ldap.createServer()

  server.bind('cn=root', function (req, res, next) {
    if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret') {
      return next(new ldap.InvalidCredentialsError())
    }
    res.end()
    return next()
  })

  server.bind(SUFFIX, function (req, res, next) {
    var dn = req.dn.toString()
    if (dn !== 'cn=user1, ' + SUFFIX || req.credentials !== 'hunter2') {
      return next(new ldap.InvalidCredentialsError())
    }
    res.end()
    return next()
  })

  server.search(SUFFIX, function (req, res, next) {
    if (req.filter.attribute === 'uid' && req.filter.value === 'user1') {
      res.send({
        dn: 'cn=user1, ou=example-org',
        attributes: {
          email: 'user1@example.org',
          uid: 'user1',
          name: 'User One'
        }
      })
    }
    res.end()
    return next()
  })

  return server
}
