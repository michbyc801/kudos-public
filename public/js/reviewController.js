 var reviewModule = angular.module('reviewModule', ["builder"]);

 reviewModule.controller('reviewController', function ($scope, Restangular, currentAccountId, currentProjectId, notificationManager, linkManager) {

     $scope.reviewServiceUrl = Builder.currentWidget.settings.endpointUrl;
     Restangular.setBaseUrl($scope.reviewServiceUrl);

     Restangular.all("example").getList().then(function (response) {
         $scope.reviews = Restangular.stripRestangular(response)
     });
 } );