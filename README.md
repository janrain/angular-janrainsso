# Angular Module for Janrain SSO

### Usage

#### 1. Install the module:

    bower install --save janrain/angular-janrainsso

#### 2. Add to scripts in html

    <script src="bower_components/angular-janrainsso/janrainsso.js"></script>
    <script src="bower_components/angular-janrainerrors/janrainerrors.js"></script>
    <script src="bower_components/angular-janrainerrors/janrainconfig.js"></script>

#### 3. Add to angular dependencies and add configuration values

E.g. in `app.js`:

    angular.module('Jiui', ['Jiui-dlman.controllers', 'Jiui-dlman.services', ... 'janrainSso'])

and:

    .constant('CONF_URL', '/ops/conf/')
    .constant('ROOT_URL', '/download/');

where `CONF_URL` is the configuration end point (see [angular-janrainconfig module](https://github.com/janrain/angular-janrainconfig)), and `ROOT_URL` is the application's root (and the root location for SSO redirection).

#### 4. Add "DashboardAuth" factory to resolve route for auth routes

Again in `app.js`

    .config(function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl',
            resolve: {auth: 'DashboardAuth'}
        })
        .otherwise({
            redirectTo: '/'
    });

### Session

The backend application should have an auth endpoint (configurable in the front end to `AUTH_URI`):

GET: () -> sessionJson
POST: (code, redirect_uri) -> { uuid, displayName, photos: [] }
DELETE: () -> OK

