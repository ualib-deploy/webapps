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