'use strict';
var app = angular.module('janrainSso', ['ngCookies', 'janrainErrors', 'janrainConfig']);

app.config(function($httpProvider) {
  $httpProvider.interceptors.push('janrainAuthErrorInterceptor');
});

app.factory('janrainSsoSession', function($window, $location, $cookies, $http, $q, $timeout, ROOT_URL, janrainConfig, janrainErrorsSvc) {

  return { get: getSession };

  function getSession() {

    return janrainConfig.then(function(configSvc) {

      var config = configSvc.get()
        , params = getQueryParams()
        , deferred = $q.defer()
        ;

      if (params && params.code && params.origin) { return createSession(params.code, params.origin); }

      return $http.get(config.authUrl)
      .then(function(res) {
        if (res.status = 200) {
          if ($cookies.originalRequest) {
            $location.path($cookies.originalRequest);
            delete $cookies.originalRequest;
          }

          return makeAuthObj(res.data);
        }

      }, function(res) {

        if (res.status === 401) {

          $cookies.originalRequest = $location.path();
          $window.janrain = {
            capture: {
              ui: {
                UNIDASH_SSO_NOLOGIN_HANDLER: function() {
                  $window.location = config.udUrl + '/signin?dest=' + encodeURIComponent($window.location.href);
                }
              }
            }
          };

          JANRAIN.SSO.CAPTURE.check_login(
            { sso_server: config.ssoUrl
            , client_id: config.clientId
            , redirect_uri: $window.location.origin + ROOT_URL
            , xd_receiver: ''
            , logout_uri: ''
            , nologin_callback: 'UNIDASH_SSO_NOLOGIN_HANDLER'
            , refresh: true
            }
          );

          $timeout(function() {
            deferred.resolve();
          }, 5000); // timeout to wait for sso js to execute

          return deferred.promise;

        } else {

          handleSessionError(res);

        }

      });

      function getQueryParams() {
        var query = $window.location.search.substring(1)
          , pairs = query.split('&')
          , queryObj = {}
          ;

        _.each(pairs, function(pair) {
          var pArr = pair.split('=');
          queryObj[ decodeURIComponent( pArr[0] ) ] = decodeURIComponent( pArr[1] );
        });

        return queryObj;
      };

      function createSession(token, origin) {
        var redirect_uri = $window.location.protocol + '//' + $window.location.host + ROOT_URL + '?origin=' + encodeURIComponent(origin);
        return $http.post(config.authUrl, null, {
          params: { 'code': token
                  , 'redirect_uri': redirect_uri
                  }
        })
        .then(function(res) {

          /* TODO: this is a hard redirect (page reload)
           * because the query string in the url is before
           * the hash (#). The sso widget appears to be
           * rewriting the url it redirects the browser to
           * in order to put the query string before the hash.
           */

          $window.location.href = ROOT_URL;

          return makeAuthObj(res.data);

        }, handleSessionError);
      };

      function handleSessionError(res) {

        janrainErrorsSvc.log(res);

      };

      function makeAuthObj(data) {

        if (!data.user) { data.user = data; }
        data.authenticated = true;
        data.logout = logout;

        return data;
      };

      function logout() {
        return $http.delete(config.authUrl)
        .then(function(){
          $window.JANRAIN.SSO.CAPTURE.logout(
            { sso_server: config.ssoUrl
            , logout_uri: config.udUrl
            }
          );
        });
      };

    });
  };

});

app.factory('DashboardAuth', function($q, janrainSsoSession) {

  var deferred = $q.defer()
    , resolvedAuth
    ;

  janrainSsoSession.get()
  .then(function(auth) {
    resolvedAuth = auth;
    deferred.resolve(resolvedAuth);
  });

  return deferred.promise;

});

app.factory('janrainAuthErrorInterceptor', function($q, $injector, $timeout) {

  return {
    'responseError': function(rejection) {

      var configSvc = $injector.get('janrainConfig');

      return configSvc.then(function(config) {

        if (rejection.status === 401 && rejection.config.url !== config.get('authUrl')) {

          $injector.get('janrainErrorsSvc').alert(
            { type: 'HTTP 401'
            , title: 'Unauthorized'
            , body: 'Logging in...'
            }
          );

          return $timeout(function() {

            var ssoSvc = $injector.get('janrainSsoSession')
              , http = $injector.get('$http')
              ;

            return ssoSvc.get().then(function(auth) {
              return http(rejection.config);
            });

          }, 100); //timeout before retrying 401ed api calls
        } else {
          return $q.reject(rejection);
        }

      });
    }
  };

});

