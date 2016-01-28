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
                 });

                angular.element($window).bind('resize', function(){
                    $maps.resizeCanvas();
                    $maps.setScale();
                    $maps.resizeImage();
                    $maps.posImage();
                    $maps.draw();
                });

                scope.$on('$destroy', function(){
                    angular.element($window).unbind('resize');
                });

            }
        };
    }]);