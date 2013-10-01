# Angular Module for Janrain SSO

### Usage

#### 1. Install the module:

    bower install --save janrain/angular-janrainsso

#### 2. Copy `sso.html` to project root and edit configuration values

#### 3. Add to scripts in html

    <script src="bower_components/angular-janrainsso/janrainsso.js"></script>

#### 4. Add to angular dependencies and add configuration values

E.g. in `app.js`:

    angular.module('Jiui', ['Jiui-dlman.controllers', 'Jiui-dlman.services', ... 'janrainSso'])

and:

    .constant('ROOT_URL', '/download/')
    .constant('AUTH_URI', '/download-api/auth/')
    .constant('SSO_URL', 'https://ud-sso-testing.janrainsso.com')
    .constant('UD_URL', 'https://ud-staging.janrain.com')

where `ROOT_URL` is the application's root (and the root location for SSO redirection), and `AUTH_URI` is the application backend's authentication endpoint.

#### 5. Add "DashboardAuth" factory to resolve route for auth routes

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

