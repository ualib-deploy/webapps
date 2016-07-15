angular.module('computersSoftware.templates', ['signage/signage.tpl.html']);

angular.module("signage/signage.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signage/signage.tpl.html",
    "<header class=\"page-row\">\n" +
    "    <nav class=\"navbar navbar-static-top navbar-mega\">\n" +
    "        <div class=\"container-fluid\">\n" +
    "            <div class=\"navbar-header\">\n" +
    "                <p class=\"navbar-text lead\">\n" +
    "                    <strong>Floor {{computers.buildings[0].floors[0].name}}</strong>\n" +
    "                </p>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"navbar-header navbar-right\">\n" +
    "                <p class=\"navbar-text lead\">\n" +
    "                    <strong>Available Computers:</strong>\n" +
    "                </p>\n" +
    "                <p class=\"navbar-text lead\">\n" +
    "                    {{computers.buildings[0].available.desktops}}\n" +
    "                </p>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </nav>\n" +
    "</header>\n" +
    "\n" +
    "<div class=\"wrap page-row page-row-expanded comp-signage-body\">\n" +
    "    <canvas id=\"asset_image\" class=\"asset-image\"></canvas>\n" +
    "</div>\n" +
    "<footer class=\"page-row\">\n" +
    "    <nav class=\"navbar navbar-static-bottom navbar-mega\">\n" +
    "        <div class=\"container-fluid\">\n" +
    "            <div class=\"nav navbar-nav\">\n" +
    "                <p class=\"navbar-text\">\n" +
    "                    <img src=\"ualib-computers-qr.jpg\" style=\"height: 50px;\"/>\n" +
    "\n" +
    "                </p>\n" +
    "                <p class=\"navbar-text\">\n" +
    "                    For computer availability in all libraries<br> visit <a href=\"#\">www.lib.ua.edu/computers</a>\n" +
    "                </p>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"nav navbar-nav navbar-right\">\n" +
    "                <p class=\"navbar-text lead\">\n" +
    "                    <strong>Apple:</strong>\n" +
    "                </p>\n" +
    "                <p class=\"navbar-text\">\n" +
    "                    <span class=\"apple available\"></span> available<br> <span class=\"apple taken\"></span> taken\n" +
    "                </p>\n" +
    "            </div>\n" +
    "            <div class=\"nav navbar-nav navbar-right\">\n" +
    "                <p class=\"navbar-text lead\">\n" +
    "                    <strong>Windows:</strong>\n" +
    "                </p>\n" +
    "                <p class=\"navbar-text\">\n" +
    "                    <span class=\"windows available\"></span> available<br> <span class=\"windows taken\"></span> taken\n" +
    "                </p>\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "    </nav>\n" +
    "</footer>\n" +
    "");
}]);

angular.module('ualib.computers.service', [
    'ualib.computers.factory'
])

    .service('Computers', ['compSoftFactory', '$timeout', '$q', '$rootScope', function(compSoftFactory, $timeout, $q, $rootScope){
        var _params = {};
        var _refresh = null;
        var _cancel = false;
        var self = this;

        this.buildings = [];
        
        this.init = function(params){
            var deferred = $q.defer();
            params = angular.isDefined(params) ? params : {};
            _params = params;

            if (_refresh) {
                self.cancelRefresh();
            }
            
            getComputers().$promise.then(function(data){
                self.buildings = angular.copy(data.buildings);
                refresh();
                deferred.resolve();
            });

            return deferred.promise;
        };

        this.cancelRefresh = function(){
            var _cancel = true;
        };
        
        function refresh(){
            if (!_cancel){
                _refresh = $timeout(function(){
                    getComputers().$promise.then(function(data){
                        self.buildings = angular.copy(data.buildings);
                        refresh();
                    });
                }, 8000);
            }
            else {
                $timeout.cancel(_refresh);
            }
        }
        
        function getComputers(){
            if (_params.hasOwnProperty('floor')){
                return compSoftFactory.floors().get(_params, function(data){
                    return data;
                }, function(data, status, headers, config) {
                    console.log('ERROR: Computers and Software');
                    console.log({
                        data: data,
                        status: status,
                        headers: headers,
                        config: config
                    });
                });
            }
            else {
                return compSoftFactory.buildings().get(_params, function(data){
                    return data;
                }, function(data, status, headers, config) {
                    console.log('ERROR: Computers and Software');
                    console.log({
                        data: data,
                        status: status,
                        headers: headers,
                        config: config
                    });
                });
            }
        }
        
        

    }]);
angular.module('ualib.computers.factory', [])

    .factory('compSoftFactory', ['$resource', '$http', function($resource, $http){
        var URL = 'https://wwwdev.lib.ua.edu/softwareList/api/buildings';

        function getTotalAvail(array, prop){
            prop = angular.isUndefined(prop) ? 'desktops' : prop;
            return array.filter(function(item){
                return prop === 'desktops' ? item.status === 3 : item.available === 0;
            }).length;
        }

        /**
         * @ngdoc function
         * @name databases.databasesFactory#appendTransform
         * @methodOf databases.databasesFactory
         *
         * @param {Array.<function()>} defaults Default `Array` of `$http` transform response transform functions from Angular - will always be `$http.defaults.transformResponse`
         * @param {function()} transform Transform function to extend the `$http.defaults.transformResponse` Array with.
         *
         * @description
         * <span class="label label-warning">Private</span>
         * Extend the default responseTransform array - Straight from Angular 1.2.8 API docs - https://docs.angularjs.org/api/ng/service/$http#overriding-the-default-transformations-per-request
         *
         * Doing this allows custom modifications of the JSON response from the API to be cached after the initial `$resource` call, instead of
         * performing these modifications on every `$digest()` cycle (e.g., make modifications once, instead of every time the databases list is refreshed).
         *
         * @returns {Array.<function()>} Returns the new `transformResponse` Array
         */
        function appendTransform(defaults, transform) {

            // We can't guarantee that the default transformation is an array
            defaults = angular.isArray(defaults) ? defaults : [defaults];
            //console.log(defaults.concat(transform));
            // Append the new transformation to the defaults
            return defaults.concat(transform);
        }

        function buildingsTransform(data){
            var b = angular.fromJson(data);
            var buildings = [];

            angular.forEach(b.buildings, function(building, idx){
                var desktops = 0;
                var laptops = 0;

                for (var i = 0, len = building.floors.length; i < len; i++){
                    var floor = {available: {}};

                    if (building.floors[i].hasOwnProperty('desktops')){
                        var d = getTotalAvail(building.floors[i].desktops, 'desktops');
                        floor.available.desktops = d;
                        desktops += d;
                    }

                    if (building.floors[i].hasOwnProperty('laptops')){
                        var l = getTotalAvail(building.floors[i].laptops, 'laptops');
                        floor.available.laptops = l;
                        laptops += l;
                    }

                    building.floors[i] = angular.extend({}, building.floors[i], floor);

                }

                building.available = {
                    desktops: desktops,
                    laptops: laptops
                };

                buildings.push(building);
            });

            b.buildings = buildings;
            return b;
        }

        return {
            buildings: function(){

                return $resource(URL, {}, {
                    get: {
                        method: 'GET',
                        transformResponse: appendTransform($http.defaults.transformResponse, buildingsTransform)
                    }
                });
            },
            floors: function(){
                return $resource(URL + '/:building/floors/:floor', {}, {
                    get: {
                        method: 'GET',
                        transformResponse: appendTransform($http.defaults.transformResponse, buildingsTransform)
                    }
                });
            }
        };
    }]);
angular.module('ualib.computers.mapsDirective', [
    'ualib.computers.maps',
    'ualib.computers.service'
])

    .directive('floorMap', ['$maps', 'Computers', '$timeout', '$window',  function($maps, Computers, $timeout, $window){
        return{
            restrict: 'AC',
            link: function(scope, elm){

                scope.floors.$promise.then(function(data){
                    $maps.init({src: 'http://wwwdev.lib.ua.edu/' + data.buildings[0].floors[0].image.url, canvas: elm[0], objects: {desktops: data.buildings[0].floors[0].desktops}}).then(function(){



                    });
                });

                /*scope.$on('detail-toggle', function(){
                 $timeout(function(){
                 $maps.refactor({width: detailElm.offsetWidth});
                 }, 100);
                 });

                 scope.reset = function(){
                 $maps.setDefaults();
                 $maps.draw();
                 $imageTools.zoomSlider.init();
                 };

                 scope.mouseZoom = function(event, delta){
                 if (zooming){
                 scope.imageTools.current = delta > 0 ? 'zoom-in' : 'zoom-out';
                 scope.imageTools.zoom(event, delta);
                 }
                 };*/

                angular.element($window).bind('resize', function(){
                    $maps.resizeCanvas();
                    $maps.resizeImage();
                    $maps.posImage();
                    $maps.draw();
                });

            }
        };
    }]);


angular.module('ualib.computers.maps', [])

    .factory('loadMap', ['$q', function($q){
        return function(src){
            var deferred = $q.defer();
            var map = new Image();

            map.onload = function(){
                deferred.resolve(map);
            };
            map.src = src;

            return deferred.promise;
        };
    }])

    .service('$maps', ['$q', 'mapStyles', function($q, styles){
        var self = this;
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.changed = false;
        this.prev = {};
        this.objects = {};

        this.margin = {
            width: 0,
            height: 0
        };
        this.offset = {
            width: 0,
            height: 0
        };

        this.x = 0;
        this.y = 0;
        this.x2 = 0;
        this.y2 = 0;
        this.width = 0;
        this.height = 0;
        this.scalar = 0.4;
        this.minScale = 0.2;
        this.maxScale = 1.4;
        this.angle = 0;

        this.setDefaults = function(){
            self.resizeCanvas();
            self.changed = false;
            self.x = 0;
            self.y = 0;
            self.angle = 0;
            self.setScale();
            self.resizeImage();
            self.center();
            //console.log({changed: self.changed});
        };

        this.refactor = function(offset){
            if (offset.width !== self.width){
                self.setOffset(offset);
                if (!self.changed){
                    self.setDefaults();
                }
                else{
                    var x = self.x + (self.prev.canvas_width - self.canvas.width)/2;
                    var y = self.y + (self.prev.canvas_height - self.canvas.height)/2;
                    if (x > 0 && (self.x+self.width) < (self.canvas.width - self.margin.width - self.offset.width)) {
                        self.x = x;
                    }
                    if (y > 0 && (self.y+self.height) < (self.canvas.height - self.margin.height - self.offset.height)) {
                        self.y = y;
                    }
                    //if ((self.x - dx) > 0 && dx < (self.x+self.width)) self.x -= dx;
                    //if ((self.y - dy) > 0 && dy < (self.y+self.height)) self.y -= dy;

                }
                self.draw();
            }
        };

        this.init = function(params){
            var deferred = $q.defer();
            if (params.src){
                if (params.offset) {
                    self.setOffset(params.offset);
                }
                if (params.objects){
                    self.objects = angular.copy(params.objects);
                }
                if (params.scalar){
                    self.scalarOffset = params.scalar;
                }
                if (params.yOffset){
                    self.yOffset = params.yOffset;
                }
                self.canvas = params.canvas;
                self.ctx = self.canvas.getContext('2d');
                self.loadImage(params.src, params.width, params.height).then(function(){
                    self.setDefaults();
                    self.draw();
                    deferred.resolve();
                });
            }
            else{
                deferred.reject('No image src given.');
            }
            return deferred.promise;
        };

        this.setOffset = function(offset){
            if (self.offset.width !== offset.width) {
                self.offset.width = offset.width;
            }
        };

        this.loadImage = function(src, width, height){
            var deferred = $q.defer();
            self.image = new Image();
            self.image.width = width;
            self.image.height = height;

            self.image.onload = function(){
                deferred.resolve();
            };
            self.image.src = src;
            return deferred.promise;
        };

        this.draw = function(){
            //console.log(self.scalar);
            // Clear the canvas
            self.clear();
            // Save matrix state
            self.ctx.save();

            self.y -= self.yOffset*self.scalar; // CUSTOM modification for digital signage - temporary
            // Translate matrix to (x, y) then scale matrix
            self.ctx.translate(self.x, self.y);
            self.ctx.scale(self.scalar, self.scalar);

            // Translate matrix to (x, y) values representing the distance to the image's center
            self.ctx.translate(self.width/2, self.height/2);
            // Rotate matrix
            self.ctx.rotate(self.angle);
            // Translate matrix back to state before it was translated to the (x, y) matching the image's center
            self.ctx.translate(-self.width/2, -self.height/2);

            // Draw image to canvas
            self.ctx.drawImage(self.image, 0, 0);

            self.drawObjects();
            // Restore matrix to it's saved state.
            // If the matrix was not saved, then altered, then restored
            // 	for every draw, then the transforms would stack (i.e., without save/restore
            //	and image at scale 1, scaled to 1.2, then scale to 1 would result in a final scale
            // 	of 1.2 - because (1 * 1.2) * 1 = 1.2
            self.ctx.restore();

            self.x2 = self.x + self.width;
            self.y2 = self.y + self.height;
        };

        this.drawObjects = function(){

            if (self.objects.hasOwnProperty('desktops')){
                self.ctx.fillStyle = styles.desktops.available.color;

                for (var i = 0, len = self.objects.desktops.length; i < len; i++){
                    var comp = self.objects.desktops[i];
                    var x = parseInt(comp.coordinates.x)-2;
                    var y = parseInt(comp.coordinates.y)-5;

                    self.ctx.save();
                    if (comp.status !== 3){
                        self.ctx.fillStyle = styles.desktops.taken.color;
                    }

                    if (comp.os === 1){
                        self.ctx.fillRect(x, y, 13, 13);
                        /*if (parseInt(comp.monitors) > 1){
                            self.ctx.fillRect(x+5, y-5, 15, 15);
                            self.ctx.clearRect(x+5, y, 10, 10);
                        }*/
                    }
                    else if (comp.os === 2){
                        x += 7;
                        y += 7;

                        self.ctx.beginPath();
                        self.ctx.arc(x, y, 7, 0, 2*Math.PI);
                        self.ctx.fill();
                    }
                    self.ctx.restore();

                }
            }
        };

        this.setScale = function(){
            var width_ratio = (self.canvas.width - self.margin.width - self.offset.width) / self.image.width;
            var height_ratio = (self.canvas.height - self.margin.height - self.offset.height) / self.image.height;
            self.scalar = Math.min(width_ratio, height_ratio);
            self.scalar += self.scalarOffset;
            /*console.log({w_ratio: width_ratio, h_ratio: height_ratio});
             console.log('width_ratio = ('+self.canvas.width+' - ('+self.margin.width+' + '+self.offset.width+')) / '+self.image.width);
             console.log('height_ratio = ('+self.canvas.height+' - ('+self.margin.height+' + '+self.offset.height+')) / '+self.image.height);*/
        };

        this.clear = function(){
            self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        };

        this.resizeCanvas = function(){
            self.prev.canvas_width = self.canvas.width;
            self.prev.canvas_height = self.canvas.height;

            self.canvas.style.width = '100%';
            self.canvas.style.height = '100%';

            self.canvas.width = self.canvas.offsetWidth;
            self.canvas.height = self.canvas.offsetHeight;

        };

        this.resizeImage = function(){
            self.width = self.image.width*self.scalar;
            self.height = self.image.height*self.scalar;
        };

        this.center = function(){
            self.x = ((self.canvas.width - self.offset.width) - self.width)/2;
            self.y = ((self.canvas.height) - self.height)/2;
        };

        this.scaleXY = function(newWidth, newHeight){
            self.x = newWidth/self.canvas.width;
            self.y = newHeight/self.canvas.height;
        };

        this.posImage = function(){
            if (!self.changed){
                self.center();
            }
            else{
                self.x *= self.canvas.width/self.prev.canvas_width;
                self.y *= self.canvas.height/self.prev.canvas_height;
            }
        };
    }]);

angular.module('ualib.computers', [
    'ngRoute',
    'ngResource',
    'angular.filter',
    'computersSoftware.templates',
    'ualib.computers.signage'
])

    .value('mapStyles', {
        desktops: {
            available: {
                shape: 'fillRect',
                color: '#61a661'
            },
            taken: {
                shape: 'strokeRect',
                color: '#eee'
            }
        }
    });
angular.module('ualib.computers.signage', [
    'ualib.computers.service',
    'ualib.computers.maps'
])

    .config(['$routeProvider', function($routeProvider){
        $routeProvider
            .when('/computers/signage/:building/:floor', {
                reloadOnSearch: false,
                resolve: {
                    floors: ['Computers', '$route', function(Computers, $route){

                        return Computers.init($route.current.params).then(function(){
                            return true;
                        });
                        /*console.log($route);
                        return CFF.floors().get($route.current.params, function(data){
                            return data;
                        }, function(data, status, headers, config) {
                            console.log('ERROR: Computers and Software');
                            console.log({
                                data: data,
                                status: status,
                                headers: headers,
                                config: config
                            });
                        });*/
                    }]
                },
                templateUrl: 'signage/signage.tpl.html',
                controller: 'SignageCtrl'
            });
    }])

    .controller('SignageCtrl', ['$scope', 'Computers', function($scope, Computers){
        $scope.computers = Computers;

    }])

    .directive('assetImage', ['$maps', '$timeout', '$window',  function($maps, $timeout, $window){
        return{
            restrict: 'AC',
            link: function(scope, elm){


                var scalar = 0.27;
                var yOffset = 60;
                var floor = parseInt(scope.computers.buildings[0].floors[0].name);

                if (floor === 3){
                    scalar = 0.14;
                    yOffset = 85;
                }
                else if(floor === 2){
                    scalar = 0.14;
                    yOffset = 85;
                }

                $maps.init({
                 src: 'http://wwwdev.lib.ua.edu/' + scope.computers.buildings[0].floors[0].image.url,
                 canvas: elm[0], objects: {desktops: scope.computers.buildings[0].floors[0].desktops},
                 width: scope.computers.buildings[0].floors[0].image.width,
                 height: scope.computers.buildings[0].floors[0].image.height,
                 scalar: scalar,
                 yOffset: yOffset
                 }).then(function(){
                    angular.element($window).bind('resize', function(){
                        $maps.resizeCanvas();
                        $maps.setScale();
                        $maps.resizeImage();
                        $maps.posImage();
                        $maps.draw();
                    });
                });



                scope.$on('$destroy', function(){
                    angular.element($window).unbind('resize');
                });

            }
        };
    }]);