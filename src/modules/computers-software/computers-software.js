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