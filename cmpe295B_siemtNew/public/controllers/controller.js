var myApp = angular.module('myApp', []);
myApp.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {
    console.log("Hello World from controller");

//     var refresh = function() {
//   $http.get('/getValue').success(function(response) {
//     console.log("I got the data I requested");
//     $scope.datalist = response;
//     $scope.datapoint = "";
//   });

// };

// refresh();


$scope.checkOptions = function() {
  console.log("inside controller"+$scope.formData.option);

  $http.post('/getValueOption', $scope.formData).success(function(response) {
    console.log(response);

    $scope.datalist = response;

    $scope.datapoint = "No data";


  });
 


};

}]);
