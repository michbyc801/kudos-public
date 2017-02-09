(function (root, client) {
  if (typeof define === 'function' && define.amd) {
    define(['popsicle'], client)
  } else if (typeof exports === 'object') {
    module.exports = client(require('popsicle'))
  } else {
    root.Document = client(root.popsicle)
  }
})(this, function (popsicle) {
  var TEMPLATE_REGEXP = /\{([^\{\}]+)\}/g

  /**
   * @param  {String} string
   * @param  {Object} interpolate
   * @param  {Object} defaults
   * @return {String}
   */
  function template (string, interpolate, defaults) {
    defaults = defaults || {}
    interpolate = interpolate || {}

    return string.replace(TEMPLATE_REGEXP, function (match, key) {
      if (interpolate[key] != null) {
        return encodeURIComponent(interpolate[key])
      }

      if (defaults[key] != null) {
        return encodeURIComponent(defaults[key])
      }

      return ''
    })
  }

  /**
   * @param  {Object} dest
   * @param  {Object} ...source
   * @return {Object}
   */
  function extend (dest /*, ...source */) {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        dest[key] = arguments[i][key]
      }
    }

    return dest
  }

  function handleRequest (client, path, method, body, options) {
    options = extend({}, client.options, options)

    var baseUri = template(options.baseUri, options.baseUriParameters)
    var hasBody = method !== 'GET' && method !== 'HEAD'
    var reqOpts = {}

    var reqBody = hasBody && body != null ? body : options.body
    var reqQuery = !hasBody && body != null ? body : options.query

    var reqOpts = {
      url: baseUri.replace(/\/$/, '') + path,
      method: method,
      headers: extend({}, options.headers),
      body: reqBody,
      query: typeof reqQuery === 'object' ? extend({}, reqQuery) : reqQuery
      //query: { 'q' : 'title:title'}
    }

    if (options.user && typeof options.user.sign === 'function') {
      options.user.sign(reqOpts)
    }

    return client.request(reqOpts)
  }

  function Resource0 (uri, client) {
    this._uri = uri
    this._client = client

    this.all = new Resource1(uri + '/all', client)
  }

  Resource0.prototype.tenant = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource2(uri, this._client)
  }

  function Resource1 (uri, client) {
    this._uri = uri
    this._client = client

  }


  Resource1.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  function Resource2 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource2.prototype.client = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource3(uri, this._client)
  }

  Resource2.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  Resource2.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource2.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource3 (uri, client) {
    this._uri = uri
    this._client = client

    this.data = new Resource4(uri + '/data', client)
    this.aggr = new Resource9(uri + '/aggr', client)
    this.indexes = new Resource11(uri + '/indexes', client)
    this.tags = new Resource14(uri + '/tags', client)
  }


  Resource3.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  Resource3.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource3.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource4 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource4.prototype.type = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource5(uri, this._client)
  }

  function Resource5 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource5.prototype.dataId = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource6(uri, this._client)
  }

  Resource5.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'hybris-metaData':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource5.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,'hybris-currencies':undefined,'Accept-Language':undefined,'hybris-languages':undefined,'hybris-metaData':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  Resource5.prototype.post = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'Content-Language':undefined,'hybris-metaData':undefined,'hybris-languages':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'POST', body, options)
  }
  Resource5.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'hybris-metaData':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  Resource5.prototype.put = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'Content-Language':undefined,'hybris-metaData':undefined,'hybris-languages':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'PUT', body, options)
  }
  function Resource6 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource6.prototype.attributeName = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource7(uri, this._client)
  }

  Resource6.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,'hybris-currencies':undefined,'Accept-Language':undefined,'hybris-languages':undefined,'hybris-metaData':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  Resource6.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'hybris-currencies':undefined,'Accept-Language':undefined,'hybris-languages':undefined,'hybris-metaData':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource6.prototype.post = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'Content-Language':undefined,'hybris-metaData':undefined,'hybris-languages':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'POST', body, options)
  }
  Resource6.prototype.put = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'Content-Language':undefined,'hybris-metaData':undefined,'hybris-languages':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'PUT', body, options)
  }
  Resource6.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource7 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource7.prototype.index = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource8(uri, this._client)
  }

  Resource7.prototype.post = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'POST', body, options)
  }
  Resource7.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource8 (uri, client) {
    this._uri = uri
    this._client = client

  }


  Resource8.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  Resource8.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource8.prototype.put = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'PUT', body, options)
  }
  Resource8.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource9 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource9.prototype.type = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource10(uri, this._client)
  }

  function Resource10 (uri, client) {
    this._uri = uri
    this._client = client

  }


  Resource10.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource10.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  function Resource11 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource11.prototype.type = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource12(uri, this._client)
  }

  function Resource12 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource12.prototype.name = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource13(uri, this._client)
  }

  Resource12.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  Resource12.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource12.prototype.post = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'POST', body, options)
  }
  Resource12.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource13 (uri, client) {
    this._uri = uri
    this._client = client

  }


  Resource13.prototype.get = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  Resource13.prototype.head = function (body, options) {
    options = extend({}, options)
    options.headers = extend({'If-None-Match':undefined,Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  Resource13.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource14 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource14.prototype.type = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource15(uri, this._client)
  }

  function Resource15 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource15.prototype.id = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource16(uri, this._client)
  }

  Resource15.prototype.post = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'POST', body, options)
  }
  Resource15.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  function Resource16 (uri, client) {
    this._uri = uri
    this._client = client

  }

  Resource16.prototype.tagName = function (/* ...args */) {
    var uri = this._uri + template('/{0}', arguments, [undefined])

    return new Resource17(uri, this._client)
  }

  function Resource17 (uri, client) {
    this._uri = uri
    this._client = client

  }


  Resource17.prototype.post = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'POST', body, options)
  }
  Resource17.prototype.delete = function (body, options) {
    options = extend({}, options)
    options.headers = extend({Authorization:undefined}, options.headers)

    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }

  function CustomResource (uri, client) {
    this._uri = uri
    this._client = client
  }

  CustomResource.prototype.checkout = function (body, options) {
    return handleRequest(this._client, this._uri, 'CHECKOUT', body, options)
  }
  CustomResource.prototype.connect = function (body, options) {
    return handleRequest(this._client, this._uri, 'CONNECT', body, options)
  }
  CustomResource.prototype.copy = function (body, options) {
    return handleRequest(this._client, this._uri, 'COPY', body, options)
  }
  CustomResource.prototype.delete = function (body, options) {
    return handleRequest(this._client, this._uri, 'DELETE', body, options)
  }
  CustomResource.prototype.get = function (body, options) {
    return handleRequest(this._client, this._uri, 'GET', body, options)
  }
  CustomResource.prototype.head = function (body, options) {
    return handleRequest(this._client, this._uri, 'HEAD', body, options)
  }
  CustomResource.prototype.lock = function (body, options) {
    return handleRequest(this._client, this._uri, 'LOCK', body, options)
  }
  CustomResource.prototype.mSearch = function (body, options) {
    return handleRequest(this._client, this._uri, 'M-SEARCH', body, options)
  }
  CustomResource.prototype.merge = function (body, options) {
    return handleRequest(this._client, this._uri, 'MERGE', body, options)
  }
  CustomResource.prototype.mkactivity = function (body, options) {
    return handleRequest(this._client, this._uri, 'MKACTIVITY', body, options)
  }
  CustomResource.prototype.mkcalendar = function (body, options) {
    return handleRequest(this._client, this._uri, 'MKCALENDAR', body, options)
  }
  CustomResource.prototype.mkcol = function (body, options) {
    return handleRequest(this._client, this._uri, 'MKCOL', body, options)
  }
  CustomResource.prototype.move = function (body, options) {
    return handleRequest(this._client, this._uri, 'MOVE', body, options)
  }
  CustomResource.prototype.notify = function (body, options) {
    return handleRequest(this._client, this._uri, 'NOTIFY', body, options)
  }
  CustomResource.prototype.options = function (body, options) {
    return handleRequest(this._client, this._uri, 'OPTIONS', body, options)
  }
  CustomResource.prototype.patch = function (body, options) {
    return handleRequest(this._client, this._uri, 'PATCH', body, options)
  }
  CustomResource.prototype.post = function (body, options) {
    return handleRequest(this._client, this._uri, 'POST', body, options)
  }
  CustomResource.prototype.propfind = function (body, options) {
    return handleRequest(this._client, this._uri, 'PROPFIND', body, options)
  }
  CustomResource.prototype.proppatch = function (body, options) {
    return handleRequest(this._client, this._uri, 'PROPPATCH', body, options)
  }
  CustomResource.prototype.purge = function (body, options) {
    return handleRequest(this._client, this._uri, 'PURGE', body, options)
  }
  CustomResource.prototype.put = function (body, options) {
    return handleRequest(this._client, this._uri, 'PUT', body, options)
  }
  CustomResource.prototype.report = function (body, options) {
    return handleRequest(this._client, this._uri, 'REPORT', body, options)
  }
  CustomResource.prototype.search = function (body, options) {
    return handleRequest(this._client, this._uri, 'SEARCH', body, options)
  }
  CustomResource.prototype.subscribe = function (body, options) {
    return handleRequest(this._client, this._uri, 'SUBSCRIBE', body, options)
  }
  CustomResource.prototype.trace = function (body, options) {
    return handleRequest(this._client, this._uri, 'TRACE', body, options)
  }
  CustomResource.prototype.unlock = function (body, options) {
    return handleRequest(this._client, this._uri, 'UNLOCK', body, options)
  }
  CustomResource.prototype.unsubscribe = function (body, options) {
    return handleRequest(this._client, this._uri, 'UNSUBSCRIBE', body, options)
  }

  function Client (options) {
    this.options = extend({
      baseUri: 'https://api.yaas.io/hybris/document/v1',
      baseUriParameters: {}
    }, options)

    this.resources = new Resource0('', this)
  }

  Client.prototype.resource = function (route, parameters) {
    var path = '/' + template(route, parameters).replace(/^\//, '')

    return new CustomResource(path, this)
  }

  Client.prototype.request = popsicle
  Client.prototype.form = Client.form = popsicle.form
  Client.prototype.version  = 'v0.1'


  return Client
})
