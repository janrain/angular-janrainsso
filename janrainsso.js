'use strict';
var app = angular.module('janrainSso', []);

app.factory('DashboardAuth', function($location, $cookies, $http, $window, AUTH_URI, ROOT_URL, SSO_URL, UD_URL) {

  var params = getQueryParams();

  if (params && params.code && params.origin) {
    return createSession(params.code, params.origin);
  } else {
    return getSession();
  }

  function getSession() {
    return $http.get(AUTH_URI)
    .then(function(data) {
      if (data.status = 200) {
        if ($cookies.originalRequest) {
          $location.path($cookies.originalRequest);
          delete $cookies.originalRequest;
        }

        var auth = data.data;
        auth.authenticated = true;
        auth.logout = logout;

        return auth;
      }

    }, handleSessionError);

  };

  function logout() {
		return $http.delete(AUTH_URI)
		.then(function(){
			$window.JANRAIN.SSO.CAPTURE.logout({
	      sso_server: SSO_URL,
	      logout_uri: UD_URL,
	   	});
		});
	};

  function createSession(token, origin) {
    var redirect_uri = $window.location.origin + ROOT_URL + '?origin=' + encodeURIComponent(origin);
    return $http.post(AUTH_URI, null, {
      params: {
        'code': token,
        'redirect_uri': redirect_uri
      }
    })
    .then(function(data) {

      /* TODO: this is a hard redirect (page reload)
       * because the query string in the url is before
       * the hash (#). Need to change the redirect url
       * from sso.html to /#/
       */
      $window.location.href = ROOT_URL;

      var auth = {
        user: data.data
      , authenticated: true
      , logout: logout
      };

      return auth;

    }, handleSessionError);
  };

  function handleSessionError(data) {

    if (data.status === 401) {

      $cookies.originalRequest = $location.path();
      $window.location.href = ROOT_URL + 'sso.html';
      return { authenticated: false };

    }

    /* TODO: error-handling audit */

    if (data.status === 502) {
      return console.log('Bad gateway on auth');
    }

    if (data.status === 404) {
      return console.log('auth not found');
    }

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

});

