var dependents = require('unpm-dependents')
var backend = require('unpm-s3-backend')
var ldapAuth = require('unpm-ldap')
var www = require('unpm-www')
var UNPM = require('unpm')
var path = require('path')

var bucket = "unpm-s3-backend-test"

var config = {
  host: {
    hostname: process.env.UNPM_HOST || 'localhost',
    port: process.env.UNPM_PORT || 8123,
    protocol: 'http'
  },
  verbose: true,
  fallback: 'http://registry.npmjs.org',
  checkauth: true,
  backend: backend({
    s3: {params: {Bucket: bucket, region: "us-west-2" }},
    baseUrl: 'https://s3-us-west-2.amazonaws.com/' + bucket + '/',
    users: {prefix: '~/users/', Bucket: bucket},
    meta: {prefix: '~/meta/', Bucket: bucket},
    store: {prefix: '~/store/', Bucket: bucket},
    tarballs: {prefix: '~/tarballs/', Bucket: bucket}
  }),
  User: ldapAuth({
    url: 'ldap://localhost:8321',
    adminDn: "cn=root",
    adminPassword: "secret",
    searchBase: "ou=example-org",
    searchFilter: 'uid={{username}}',
    verbose: true
  })
}

var unpm = new UNPM(config)

dependents(unpm)
www(null, '', 'unpm')
unpm.middleware.push(docs)
unpm.middleware.push(status)
unpm.server.listen(unpm.port)
unpm.log.info('Started unpm on port %s', unpm.port)

function docs(respond, matched, unpm, next) {
  var headers = respond.req.headers
  var route

  var acceptable = headers.accept && headers.accept.match(/image|(text\/(?:html|css))/)
  var tarball = respond.req.url.match(/\.tgz$/i)

  if (acceptable && !tarball) {
    route = www.router.match(respond.req.method, respond.req.url)
  }

  if (!route) {
    return next()
  }

  route.fn(respond.req, respond.res, route, www.config)
}

function status(respond, matched, unpm, next) {
  if (respond.req.url !== '/status/check') return next()
  respond(200, {status: 'ok'})
}
