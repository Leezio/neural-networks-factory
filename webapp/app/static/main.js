var app = angular.module('app', ['rzModule']);

app.controller('MainCtrl', function ($scope, $http, $window, $q) {
    var vm = this;

    $scope.PlayIsVisible = true;
    $scope.SpinnerIsVisible = false;
    $scope.prediction = undefined;

    $scope.play = function () {
        $scope.PlayIsVisible = false;
        $scope.SpinnerIsVisible = true;
        if ($scope.predictionTextarea == undefined || $scope.predictionTextarea == null) {
            console.log("No sentence available");
            $scope.PlayIsVisible = true;
            $scope.SpinnerIsVisible = false;
            return;
        }
        $http.get("http://localhost:8000/predict/" + $scope.predictionTextarea)
            .then(function (response) {
                console.log(response);
                $scope.PlayIsVisible = true;
                $scope.SpinnerIsVisible = false;
                /** $scope.resultAccuracy = response.data.Result.Accuracy; **/
                /** $scope.resultScore = response.data.Result.Score; **/
                $scope.resultAccuracy = $scope.resultScore = "This value ​​can not be obtained on pre-trained models !";
                $scope.prediction = response.data.Result.Prediction;
            }).catch(function (data) {
                console.log(data);
                $scope.PlayIsVisible = false;
                $scope.SpinnerIsVisible = true;
            });
    };

    $scope.stop = function () {
        $http.get("http://localhost:8000/")
            .then(function (response) {
                console.log("Stop: " + vm.inputLayerHeight, vm.hiddenLayersCount, vm.hiddenLayersHeight, vm.outputLayerHeight);
            });
    };

    $scope.reset = function () {
        $http.get("http://localhost:8000/")
            .then(function (response) {
                console.log("Reset: " + vm.inputLayerHeight, vm.hiddenLayersCount, vm.hiddenLayersHeight, vm.outputLayerHeight);
            });
    };

    vm.inputLayerHeight = 15;
    vm.hiddenLayersCount = 2;
    vm.hiddenLayersHeight = 15;
    vm.outputLayerHeight = 1;

    var networkGraph = {
        "nodes": []
    };

    var width = $window.innerWidth - 15;
    var height = 400,
        nodeSize = 15;

    var color = d3.scale.category20();

    angular.element($window).on('resize', function () {
        width = $window.innerWidth;
        draw();
    });

    vm.inputLayerHeightSlider = {
        value: 15,
        options: {
            floor: 5,
            ceil: 20,
            showTicks: true,
            id: 'input-height-step-slider',
            onChange: function (id) {
                vm.inputLayerHeight = vm.inputLayerHeightSlider.value;
                draw();
            }
        }
    };

    vm.hiddenLayerCountSlider = {
        value: 2,
        options: {
            floor: 1,
            ceil: 4,
            showTicks: true,
            id: 'hidden-count-step-slider',
            onChange: function (id) {
                vm.hiddenLayersCount = vm.hiddenLayerCountSlider.value;
                draw();
            }
        }
    };

    vm.hiddenLayersHeightSlider = {
        value: 15,
        options: {
            floor: 5,
            ceil: 20,
            showTicks: true,
            id: 'hidden-height-step-slider',
            onChange: function (id) {
                vm.hiddenLayersHeight = vm.hiddenLayersHeightSlider.value;
                draw();
            }
        }
    };

    vm.outputLayerHeightSlider = {
        value: 1,
        options: {
            floor: 1,
            ceil: 10,
            showTicks: true,
            id: 'output-height-step-slider',
            onChange: function (id) {
                vm.outputLayerHeight = vm.outputLayerHeightSlider.value;
                draw();
            }
        }
    };

    $scope.$watchGroup(['vm.inputLayerHeight', 'vm.hiddenLayersCount', 'vm.hiddenLayersHeight', 'vm.outputLayerHeight'], function (newVal, oldVal) {
        //vm.inputLayerHeight = ;
        //vm.hiddenLayersCount = ;
        //vm.hiddenLayersHeight = ;
        //vm.outputLayerHeight = ;
    });

    vm.draw = draw;

    function buildNodeGraph() {
        var newGraph = {
            "nodes": []
        };

        //construct input layer
        var newFirstLayer = [];
        for (var i = 0; i < vm.inputLayerHeight; i++) {
            var newTempLayer = { "label": "i" + i, "layer": 1 };
            newFirstLayer.push(newTempLayer);
        }

        //construct hidden layers
        var hiddenLayers = [];
        for (var hiddenLayerLoop = 0; hiddenLayerLoop < vm.hiddenLayersCount; hiddenLayerLoop++) {
            var newHiddenLayer = [];
            //for the height of this hidden layer
            for (var i = 0; i < vm.hiddenLayersHeight; i++) {
                var newTempLayer = { "label": "h" + hiddenLayerLoop + i, "layer": (hiddenLayerLoop + 2) };
                newHiddenLayer.push(newTempLayer);
            }
            hiddenLayers.push(newHiddenLayer);
        }

        //construct output layer
        var newOutputLayer = [];
        for (var i = 0; i < vm.outputLayerHeight; i++) {
            var newTempLayer = { "label": "o" + i, "layer": vm.hiddenLayersCount + 2 };
            newOutputLayer.push(newTempLayer);
        }

        //add to newGraph
        var allMiddle = newGraph.nodes.concat.apply([], hiddenLayers);
        newGraph.nodes = newGraph.nodes.concat(newFirstLayer, allMiddle, newOutputLayer);

        return newGraph;

    }

    function drawGraph(networkGraph, svg) {
        var graph = networkGraph;
        var nodes = graph.nodes;

        // get network size
        var netsize = {};
        nodes.forEach(function (d) {
            if (d.layer in netsize) {
                netsize[d.layer] += 1;
            } else {
                netsize[d.layer] = 1;
            }
            d["lidx"] = netsize[d.layer];
        });

        // calc distances between nodes
        var largestLayerSize = Math.max.apply(
            null, Object.keys(netsize).map(function (i) { return netsize[i]; }));

        var xdist = width / Object.keys(netsize).length,
            ydist = (height - 15) / largestLayerSize;

        // create node locations
        nodes.map(function (d) {
            d["x"] = (d.layer - 0.5) * xdist;
            d["y"] = (((d.lidx - 0.5) + ((largestLayerSize - netsize[d.layer]) / 2)) * ydist) + 10;
        });

        // autogenerate links
        var links = [];
        nodes.map(function (d, i) {
            for (var n in nodes) {
                if (d.layer + 1 == nodes[n].layer) {
                    links.push({ "source": parseInt(i), "target": parseInt(n), "value": 1 })
                }
            }
        }).filter(function (d) { return typeof d !== "undefined"; });

        // draw links
        var link = svg.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("x1", function (d) { return nodes[d.source].x; })
            .attr("y1", function (d) { return nodes[d.source].y; })
            .attr("x2", function (d) { return nodes[d.target].x; })
            .attr("y2", function (d) { return nodes[d.target].y; })
            .style("stroke-width", function (d) { return Math.sqrt(d.value); });

        // draw nodes
        var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            }
            );

        var circle = node.append("circle")
            .attr("class", "node")
            .attr("r", nodeSize)
            .style("fill", function (d) { return color(d.layer); });

        node.append("text")
            .attr("dx", "-.35em")
            .attr("dy", ".35em")
            .attr("font-size", ".6em")
            .text(function (d) { return d.label; });
    }

    function draw() {

        if (!d3.select("svg")[0]) {

        } else {
            //clear d3
            d3.select('svg').remove();
        }

        var svg = d3.select("#neuralNet").append("svg")
            .attr("width", width)
            .attr("height", height);

        networkGraph = buildNodeGraph();
        //buildNodeGraph();
        drawGraph(networkGraph, svg);
    }

    function init() {

        draw()
    }

    init()
});

'use strict';

function sigmoid(ddx) {
    return function (x) {
        return ddx ?
            x * (1 - x) :
            1.0 / (1 + Math.exp(-x));
    };
}