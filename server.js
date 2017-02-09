#!/bin/env node
//  OpenShift sample Node application

require('es6-promise').polyfill();
var express  = require('express');
var fs       = require('fs');
var Oauth2   = require('./resources/js/oauth2');
var Document = require('./resources/js/document');
var basicAuth = require('basic-auth');
var Ajv = require('ajv');
var cors = require('cors');




/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;

    /*
     * JSON-schemas to validate create/update requests.
     * Object keys form path of the request <path>.<method>.<request data location>
     * eg. /rate.POST.body means that
     * schema under those keys will validate /rate url, POST method, and body inside request 
     */
    var schemas = {
        '/rate': {
            'POST': {
                'body': {
                    'title': 'Rate POST body schema',
                    'type': 'object',
                    'required': ['user', 'package', 'rate'],
                    'properties': {
                        'user': {
                            'type': 'string',
                            'format': 'email'
                        },
                        'package': {
                            'type': 'string',
                            'pattern': '^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$'
                        },
                        'rate': {
                            'type': 'number',
                            'minimum': 1,
                            'maximum': 5
                        }
                    }
                }
            }
        }
    };

    var schemasCompiled = {};

    var ajv = Ajv({allErrors: true, format: 'full'});

    self.compileSchemas = function() {
        for (path in schemas) {
            schemasCompiled[path] = {};
            for (method in schemas[path]) {
                schemasCompiled[path][method] = {};
                for (reqData in schemas[path][method]) {
                    schemasCompiled[path][method][reqData] = ajv.compile(schemas[path][method][reqData]);
                }
            }
        }
    };


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        }
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    // Is Basic Auth enabled
    var basicAuthEnabled = false;

    /**
     * Provide Basic Authorization logic
     */
    var auth = function (req, res, next) {
        
        // Basic auth disabled - go further 
        if(!basicAuthEnabled)
            return next();

        // Basic auth enabled - check credentials
        function unauthorized(res) {
            res.writeHead(401, { 'Content-Type': 'application/json'});
            return res.end(JSON.stringify(createErrorResponseBody('Request not authorized.')));
        }

        var user = basicAuth(req);

        if (!user || !user.name || !user.pass) {
            return unauthorized(res);
        }

        if (user.name === 'user' && user.pass === 'pass') {
            return next();
        } else {
            return unauthorized(res);
        }
    };

    function validate(req, res, next) {
        var validators = schemasCompiled[req.path][req.method];
        if (validators === undefined) {
            throw 'Undefined validation schema path';
        }

        function _validate(reqData, errors) {
            var valid = validators[reqData](req[reqData]);

            // if we have errors, copy necessary information
            if (!valid) {
                errors[reqData] = JSON.parse(
                    JSON.stringify(validators[reqData].errors));
            }

            return valid;
        }

        var errors = {};
        var valid = true;
        ['body', 'query', 'headers'].map(function(reqData) {
            if (Object.prototype.hasOwnProperty.call(validators, reqData)) {
                var v = _validate(reqData, errors);

                if (!v) {
                    valid = false;
                }
            }
        });

        if (valid) {
            next();
        } 
        else {
            res.send(400, {'errors': errors});
        }
        
    }
    

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };

         self.routes['/example'] = function(req, res) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send('[{"id":"a"},{"id":"b"},{"id":"c"},{"id":"d"},{"id":"e"}]');
        };

		self.routes['/example_subs'] = function(req, res) {
			res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send('[{ "id": "IWT89MX6" , "img": "sample_img.jpg" , "package": { "name": "Persistence" , "shortDescription": "The Persistence Package is a bundle of important baseline services needed to store and access all kinds of data." } }, { "id": "UMFM03RF" , "img": "sample_img.jpg" , "package": { "name": "Media" , "shortDescription": "The Media Package supports storing media (e.g. imagery, video) in multi-tenant - and multi-client - environments." } }, { "id": "0ZDT586Z" , "img": "sample_img.jpg" , "package": { "name": "Market Catalog (Wookies using it in gandalf service)" } }, { "id": "TNRCJQW1" , "img": "sample_img.jpg" , "package": { "name": "Product Content" , "shortDescription": "The Product Content Package provides APIs to support back-office management tasks, display of and search within product data." } }, { "id": "IWT89MX4" , "img": "sample_img.jpg" , "package": { "name": "Persistence" , "shortDescription": "The Persistence Package is a bundle of important baseline services needed to store and access all kinds of data." } }, { "id": "UMFM03RA" , "img": "sample_img.jpg" , "package": { "name": "Media" , "shortDescription": "The Media Package supports storing media (e.g. imagery, video) in multi-tenant - and multi-client - environments." } } ]');
		};

		self.routes['/example_user_ratings'] = function(req, res) {
			res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
			res.send('[{ "id": 1 , "subscriptionID": "IWT89MX6" , "user": "test_user" , "rate": 0 , "avgRate": 0 }, { "id": 2 , "subscriptionID": "UMFM03RF" , "user": "test_user" , "rate": 3 , "avgRate": 4.5 }, { "id": 3 , "subscriptionID": "0ZDT586Z" , "user": "test_user" , "rate": 2 , "avgRate": 2.5 }, { "id": 4 , "subscriptionID": "TNRCJQW1" , "user": "test_user" , "rate": 1 , "avgRate": 3.1 }, { "id": 5 , "subscriptionID": "IWT89MX4" , "user": "test_user" , "rate": 1 , "avgRate": 3.2 }, { "id": 6 , "subscriptionID": "UMFM03RA" , "user": "test_user" , "rate": 3 , "avgRate": 3.4 }]');
		};

        /**
         *  Get access-token (must not be available in final release!)
         */
        self.routes['/oauth2'] = function(req, res) {
            var reqUrl = '[/oauth2]';
            var client = self.oauth2.resources.token;

            console.log(reqUrl + ' has been requested');

            var body = 'grant_type=client_credentials&client_id=' + self.CLIENT_ID + '&client_secret=' + self.CLIENT_SECRET + '&scope=hybris.document_view hybris.document_admin hybris.document_manage';

            client.post(body, {
                baseUri: 'https://api.yaas.io/hybris/oauth2/v1/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(function(yaasRes) {
                if(yaasRes.status === 200) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(yaasRes.body);
                } else {
                    handleYaasError(res, reqUrl, yaasRes.status);
                }
            }).catch(function (errorRes) {
                handleConnectionError(res, reqUrl, 'Authorization service', errorRes.original.errno);
            });
        };

        /**
         * Get all rates
         */
		self.routes['/rate'] = function(req, res) {
            var reqUrl = '[/rate]';
            console.log(reqUrl + ' has been requested');

            getHeaderForRequest().then(function(header) {
                return getRateRequest().get(null, header);
            }).then(function(yaasRes) {
                if(yaasRes.status == 200) {
                    res.writeHead(200, { 'Content-Type': 'application/json'});
                    res.end(JSON.stringify(yaasRes.body));
                } else {
                    handleYaasError(res, reqUrl, yaasRes.status);
                }
            }).catch(function (errorRes) {
                handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
            });
        };

        /**
         * Get all packages
         */
        self.routes['/package'] = function(req, res) {
            var reqUrl = '[/package]';
            console.log(reqUrl + ' has been requested');
            getHeaderForRequest().then(function(header) {
                return getPackageRequest().get(null, header);
            }).then(function(yaasRes) {
                if(yaasRes.status == 200) {
                    res.writeHead(200, { 'Content-Type': 'application/json'});
                    res.end(JSON.stringify(yaasRes.body));
                } else {
					console.log(yaasRes);
                    handleYaasError(res, reqUrl, yaasRes.status);
                }
            }).catch(function (errorRes) {
                handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
            });
        };

        /**
         * Get single package
         */
        self.routes['/package/:packageId/'] = function(req, res) {
            var reqUrl = '[/package/' + req.params.packageId + '/]';
            
            console.log(reqUrl + ' has been requsted');
            getPackage(req.params.packageId).then(function(yaasRes) {
                if(yaasRes.status == 200) {
                    res.writeHead(200, {'Content-Type' : 'application/json'});
                    res.end((JSON.stringify(yaasRes.body)));
                } else {
                    handleYaasError(res, reqUrl, yaasRes.status);
                }
            }).catch(function (errorRes) {
                handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
            });
        };

        /**
         * Get single package with user rate
         */
        self.routes['/package/:packageId/user/:userId'] = function(req, res) {
            var packageId = req.params.packageId;
            var userId = req.params.userId;
            var reqUrl = '[/package/' + packageId + '/user/' + userId + ']';
            console.log(reqUrl + ' has been requsted');

            getPackage(packageId).then(function(packageRes) {
                if(packageRes.status == 200) {
                    return getUserRate(userId, packageId).then(function(userRateRes) {
                        if(userRateRes.status == 200) { 
                            if(userRateRes.body.length === 1) {
                                packageRes.body[0].userRate = { rate: userRateRes.body[0].rate };
                            }
                            res.writeHead(200, {'Content-Type' : 'application/json'});
                            res.end((JSON.stringify(packageRes.body[0])));
                        } else {
                            handleYaasError(res, reqUrl, userRateRes.status);
                        }
                    });
                } else {
                    handleYaasError(res, reqUrl, packageRes.status);
                }
            }).catch(function (errorRes) {
                handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
            });
        };

    };

    self.post_routes = function() {

        /**
         * Rate a package
         */
        self.app.post('/rate', auth, validate, function(req, res) {

            var user = req.body['user'];
            var packageName = req.body['package'];
            var rate = req.body['rate'];

            if (user === undefined || packageName === undefined || rate === undefined) {
                res.writeHead(400, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: 'Query has to contain fields: user, package, rate!'}));
                return;
            } else if(typeof(rate) !== 'number' || rate < 1 || rate > 5) {
                res.writeHead(400, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: 'Rate must be number between 1 and 5!'}));
                return;
            }

            var reqUrl = 'POST [/rate]';
            console.log(reqUrl + " has been requested. [user: " + user + "], [packageName:" + packageName + "], [rate: " + rate + ']');

            getUserRate(user, packageName).then(function(userRate) {
                var userOldRate;
                var userRateId;
                
                if(userRate.body.length === 1) {
                    userOldRate = userRate.body[0]['rate'];
                    userRateId = userRate.body[0]['id'];

                    if(userOldRate === rate) {
                        res.writeHead(400, { 'Content-Type': 'application/json'});
                        res.end(JSON.stringify({message: "You have already rated this package with the same value"}));
                        return;
                    } else {
                        updateSingleRate(userRateId, rate).then(function(yaasRes) {                            
                            if(yaasRes.status !== 200 && yaasRes.status !== 201) {
                                handleYaasError(res, reqUrl, yaasRes.status);
                            }
                        }).catch(function (errorRes) {
                            handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
                        });
                    }
                } else {
                    addRate(user, packageName, rate).then(function(addedRate) {
                        if(addedRate.status !== 201) {
                            handleYaasError(res, reqUrl, addedRate.status);
                            return;
                        }

                        console.log('[User: ' + user + '] has rated [package: ' + packageName + '] for the first time, with [rate: ' + rate + ']');
                        getPackage(packageName).then(function(packageRes) {
                            if(packageRes.status === 200) {
                                res.writeHead(200, { 'Content-Type': 'application/json'});
                                res.end(JSON.stringify(packageRes.body));
                            } else {
                                handleYaasError(res, reqUrl, packageRes.status);
                            }
                        });
                    }).catch(function (errorRes) {
                        handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
                    });
                }

                if(rate !== userOldRate) {
                    addRateToPackage(packageName, userOldRate, rate).then(function(ratedPackage) {
                        return getPackage(packageName).then(function(packageRes) 
                        {
                            if(packageRes.status == 200) {
                                res.writeHead(200, { 'Content-Type': 'application/json'});
                                res.end(JSON.stringify(packageRes.body));
                            } else {
                                handleYaasError(res, reqUrl, packageRes.status);
                            }
                        });
                    }).catch(function (errorRes) {
                        handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
                    })
                }

            }).catch(function (errorRes) {
                handleConnectionError(res, reqUrl, 'Database', errorRes.original.errno);
            });
        });
    };

    function updateSingleRate(userRateId, rate) {
        return getHeaderForRequest().then(function(header) {
            var query = 'patch:true';
            header['query'] = { 'patch' : 'true' };
            var body = { 'rate' : rate };

            return getRateRequest().dataId(userRateId).put(body, header);
        });
    }

    function getUserRate(userId, packageRef) {
        return getHeaderForRequest().then(function (header) {
            var query = 'user:' + userId + ' package:' + packageRef;
            header['query'] = { 'q' : query};

            return getRateRequest().get(null, header);
        });
    }

    function getPackage(packageId) {
        return getHeaderForRequest().then(function(header) {
            var query = 'packageRef:' + packageId;
            header['query'] = { 'q' : query};

            return getPackageRequest().get(null, header);
        });
    }

    function getRateRequest() {
        var documentClient = new Document();
        return documentClient.resources.tenant('kudos').client('kudos.client').data.type('Rate');
    }

    function getPackageRequest() {
        var documentClient = new Document();
        return documentClient.resources.tenant('kudos').client('kudos.client').data.type('Package');
    }

    function getHeaderForRequest() {
        return getAccessToken().then(function(token) {
            return { 'headers': {
                'Authorization': 'Bearer ' + token
            }};
        });
    }

    function getAccessToken() {
        var client = self.oauth2.resources.token;

        var body = 'grant_type=client_credentials&client_id=' + self.CLIENT_ID + '&client_secret=' + self.CLIENT_SECRET + '&scope=hybris.document_view hybris.document_admin hybris.document_manage';

        return client.post(body, {
            baseUri: 'https://api.yaas.io/hybris/oauth2/v1/',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function(yaasRes) {
            if(yaasRes.status === 200) {
                return yaasRes.body.access_token;
            }
        });
    }

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.use(express.json());
		self.app.use(cors());

        self.app.use(express.static('public'));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, auth, self.routes[r]);
        }

        //Add handlers for POST endpoints;
        self.post_routes();
    };

    var availableRates = ['no_rate', 'rate_1', 'rate_2', 'rate_3', 'rate_4', 'rate_5'];
    function addRateToPackage(packageRef, userOldRate, rate) {
        return getPackage(packageRef).then(function(package) {
            console.log('Adding [rate:' + rate + '] to [package: ' + packageRef + ']');

            return getHeaderForRequest().then(function (header) {
				var body = {};
                if(package.body.length === 1) {
                    header['query'] = { 'patch' : 'true' };

                    var increasedRateCount = 1 + package.body[0][availableRates[rate]];
                    var increaseRateField = availableRates[rate];

                    body[increaseRateField] = increasedRateCount;

                    if (userOldRate !== undefined) {
                        var decreasedRateCount = -1 + package.body[0][availableRates[userOldRate]];
                        var decreaseRateField = availableRates[userOldRate];
                        body[decreaseRateField] = decreasedRateCount;
                    }

                    var packageId = package.body[0].id;
                    return getPackageRequest().dataId(packageId).put(body, header).then(function(res){
                        console.log('[Package:' + package + '] rate has been updated');
                    });
                } else {
                     body = {
                        'packageRef': packageRef,
                        'rate_1' : 0,
                        'rate_2' : 0,
                        'rate_3' : 0,
                        'rate_4' : 0,
                        'rate_5' : 0
                    };
                    body[availableRates[rate]] = 1;
                    return getPackageRequest().post(body, header).then(function(res) {
                        console.log('[Package:' + package + '] has been created with [User: ' + user + '] [rate:' + rate + ']');
                    });
                }

            });
        });
    }

    function addRate(user, package, rate) {
        return getHeaderForRequest().then(function(header) {
            var body = {};
            body['user'] = user;
            body['package'] = package;
            body['rate'] = rate;

            return getRateRequest().post(body, header);
        });
    }

    /**
     * Create default error message.
     */
    function createDefaultErrorMsg(subject, errCode) {
        if (errCode === 'EUNAVAILABLE') {
            return subject + ' is currently unavailable';
        } else if (errCode === 'ETIMEOUT') {
            return subject + ' timeout has occured';
        } else {
            return subject + ': an unexpected error has occured.';
        }
    }

    /**
     * Create default error response body.
     */
    function createErrorResponseBody(errorMsg) {
        var errorResponse = {
            message: errorMsg
        };

        return errorResponse;
    }

    /**
     * Standard way of handling Yaas errors.
     */
    function handleYaasError(res, reqUrl, errorStatus) {
        console.log(reqUrl + ' Error status: ' + errorStatus);
        res.writeHead(500, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(createErrorResponseBody('Unexpected error has occured.')));
    }

    /**
     * Standard way of handling connection errors.
     */
    function handleConnectionError(res, reqUrl, subject, errorCode) {
        var errorMsg = createDefaultErrorMsg(subject, errorCode);
        console.log(reqUrl + ' Error: ' + errorMsg);

        res.writeHead(500, { 'Content-Type': 'application/json'});
        res.status(500);
        res.end(JSON.stringify(createErrorResponseBody(errorMsg)));
    }

    self.setupCustomVariables = function() {
        self.oauth2 = new Oauth2();
        self.CLIENT_ID = 'GXQyjO9dd8cZ34kEtRBfQXaj4X4pWz7b';
        self.CLIENT_SECRET = 'SJcU6kPKla6setuC';
    };

    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        self.setupCustomVariables();

        // Compile schemas for validation
        self.compileSchemas();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

