'use strict';
var app = angular.module('janrainSso', ['ngCookies', 'janrainErrors', 'janrainConfig']);

app.factory('DashboardAuth', function($location, $cookies, $http, $window, $route, ROOT_URL, janrainErrorsSvc, janrainConfig) {

  return janrainConfig.then(function(configSvc) {

    var config = configSvc.get()
      , params = getQueryParams()
      ;

    if (params && params.code && params.origin) {
      return createSession(params.code, params.origin);
    } else {
      return getSession();
    }

    function getSession() {

      return $http.get(config.authUrl)
      .then(function(res) {
        if (res.status = 200) {
          if ($cookies.originalRequest) {
            $location.path($cookies.originalRequest);
            delete $cookies.originalRequest;
          }

          return makeAuthObj(res.data);
        }

      }, function(data) {

        if (data.status === 401) {

          $cookies.originalRequest = $location.path();
          $window.janrain = {
            capture: {
              ui: {
                UNIDASH_SSO_NOLOGIN_HANDLER: function(data) {
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

          return { authenticated: false };

        } else {

          handleSessionError(data);

        }

      });

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

    function createSession(token, origin) {
      var redirect_uri = $window.location.protocol + '//' + $window.location.host + ROOT_URL + '?origin=' + encodeURIComponent(origin);
      return $http.post(config.authUrl, null, {
        params: { 'code': token,
                , 'redirect_uri': redirect_uri
                }
      })
      .then(function(res) {

        /* TODO: this is a hard redirect (page reload)
         * because the query string in the url is before
         * the hash (#). The sso widget appears to be
         * rewriting the the url it redirects the browser
         * to to put the query string before the hash.
         */

        $window.location.href = ROOT_URL;

        return makeAuthObj(res.data);

      }, handleSessionError);
    };

    function handleSessionError(data) {

      janrainErrorsSvc.httpError(data);

    };

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

    function makeAuthObj(data) {

      if (!data.user) { data.user = data; }
      data.authenticated = true;
      data.logout = logout;

      return data;
    };

  });

});

