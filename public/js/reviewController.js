var reviewModule = angular.module('reviewModule', ["builder"]);

reviewModule.controller('reviewController', function ($scope, Restangular, currentWidget, currentAccountId, currentProjectId, currentOrganizationId, authManager, notificationManager, linkManager) {

    $scope.reviewServiceUrl = Builder.currentWidget.settings.endpointUrl;
    Restangular.setBaseUrl($scope.reviewServiceUrl);

    // test api get subscriptions 'https://api.yaas.io/sap/subscription/v1/subscriberOrgs/'
    $scope.getSubscriptions = function (callback) {
        authManager().authorize().then(function (auth) {
            Restangular.oneUrl('testapicall', 'https://api.yaas.io/sap/subscription/v1/')
                .one('subscriberOrgs', currentOrganizationId)
                .one('subscribers', currentProjectId)
                .all('subscriptions')
                .getList({ 'Authorization': 'Bearer ' + auth.accessToken })
                .then(callback)
        });
    };

    $scope.getPackagesRates = function () {
        $scope.getSubscriptions(function (response) {
            $scope.subscriptions = Restangular.stripRestangular(response);
            Restangular.all('package').getList().then(function (response) {
                $scope.packages = Restangular.stripRestangular(response);
                Restangular.oneUrl('marketproductscall', 'https://api.eu.yaas.io/hybris/marketplace-catalog/v1/products?market=betaPriceGroup&pageNumber=1&pageSize=1000').getList().then(function (response) {
                    $scope.marketProducts = Restangular.stripRestangular(response);
                    $scope.relatedPackages = $scope.getRelatedPackages($scope.subscriptions, $scope.packages, $scope.marketProducts);
                    $scope.relatedPackages.forEach(function (relatedPackage) {
                        Restangular.one('package', relatedPackage.userRating.subscriptionID).one('user', relatedPackage.subscriberId).get().then(function (userRateResponse) {
                            relatedPackage.userRating.rate = Restangular.stripRestangular(userRateResponse).userRate.rate;
                        });
                    });
                });
            });
        });
    };

    $scope.getPackagesRates();

    $scope.getRelatedPackages = function (subscriptions, packages, marketProducts) {
        var relatedPackages = [];
        subscriptions.forEach(function (subscription) {
            var packageExists = _.find(relatedPackages, function (item) {
                return item.userRating.subscriptionID == subscription.package.id
            });
            if (!packageExists) {
                var marketProduct = _.find(marketProducts, function (item) {
                    return item.code == subscription.package.id
                });
                var relatedPackage = {
                    subName: subscription.package.name,
                    subShortDesc: subscription.package.shortDescription || "n/a",
                    subscriberId: subscription.subscriber.user,
                    userRating: {
                        subscriptionID: subscription.package.id,
                        avgRate: 0,
                        rate: null
                    },
                    img: marketProduct.mixins.package.icon
                };
                packages.forEach(function (packageObject) {
                    if (subscription.package.id == packageObject.packageRef) {
                        relatedPackage.userRating.avgRate = $scope.countAverageRating(packageObject);
                    }
                });
                relatedPackages.push(relatedPackage);
            }
        });
        return relatedPackages;
    };

    $scope.countAverageRating = function (packageObject) {
        var ratePrefix = 'rate_';
        var ratesSum = 0;
        var ratesCount = 0;
        for (var i = 1; i <= 5; i++) {
            ratesSum += packageObject[ratePrefix + i] * i;
            ratesCount += packageObject[ratePrefix + i];
        }
        return ratesSum / ratesCount;
    };

    $scope.updateRate = function (subId, newRating) {
        var index = $scope.relatedPackages.findIndex($scope.findIndexOfSub, subId);
        if ($scope.relatedPackages[index].userRating.rate != newRating) {
            $scope.relatedPackages[index].userRating.rate = newRating;
            Restangular.all("rate").post({
                user: $scope.relatedPackages[index].subscriberId,
                package: subId,
                rate: newRating
            }).then(function (response) {
                var packages = Restangular.stripRestangular(response);
                if (packages[0])
                    $scope.relatedPackages[index].userRating.avgRate = $scope.countAverageRating(packages[0]);
                else
                    $scope.relatedPackages[index].userRating.avgRate = newRating;
            })
        }
    };

    $scope.findIndexOfSub = function (element) {
        return element.userRating.subscriptionID == this;
    };


    $scope.reloadIFrame = function () {
        $('body').wrapInner('<div style="position: absolute; width: 100%; height: 100%; overflow: auto"></div>');
    };
});

reviewModule.filter('range', function () {
    return function (n) {
        var res = [];
        for (var i = 0; i < n; i++) {
            res.push(i);
        }
        return res;
    };
});
