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

