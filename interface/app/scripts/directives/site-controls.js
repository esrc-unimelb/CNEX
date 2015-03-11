'use strict';

angular.module('interfaceApp')
  .directive('siteControls', [ '$rootScope', '$window', 'DataService', 'configuration', 'D3Service', 'SolrService',
        function ($rootScope, $window, DataService, configuration, d3s, SolrService) {
    return {
      templateUrl: 'views/site-controls.html',
      restrict: 'E',
      scope: {
      },
      link: function postLink(scope, element, attrs) {
          scope.labelsVisible = true;

          var w = angular.element($window);
          w.bind('resize', function() {
              scope.$apply(function() {
                  sizeThePanel();
              })
          });

          var sizeThePanel = function() {
              var e = angular.element(document.getElementById('dateVisContainer'));
              scope.controlsPanelStyle = {
                  'height': $window.innerHeight - 15,
                  'overflow-y': 'auto'
              }
          }
          sizeThePanel();
          scope.showData = false;

          // populate the controls widget
          scope.$on('graph-data-loaded', function() {
              scope.site = DataService.site;
              scope.data = {
                  nodes: DataService.nodes,
                  links: DataService.links,
                  unConnected: DataService.unConnectedNodes,
                  percentUnConnected: DataService.unConnectedNodes.length / (DataService.nodes.length + DataService.unConnectedNodes.length) * 100,
              }

              // if there are unconnected nodes - enable the download button
              if (DataService.unConnectedNodes === undefined) {
                  scope.unconnectedDownload = false;
              } else {
                  scope.construct('unconnected');
                  scope.unconnectedDownload = true;
              }

              var types = {};
              angular.forEach(scope.data.nodes, function(v,k) { 
                  if (types[v.type] === undefined) {
                      types[v.type] = { 'count': 1, 'checked': false, 'color': v.color, 'coreType': v.coreType };
                  } else {
                      types[v.type].count += 1;
                  }
              })
              scope.data.types = types;
          })

          // process the data when it's available
          scope.$on('node-data-ready', function() {
              var cndata;
              scope.contextNodeData = DataService.contextNode;
              if (DataService.contextNode !== undefined) {
                  // ensure no types are stored as we're in clicky node land
                  scope.clearTypes();

                  // get the context node data and extract the node from the selected array
                  scope.contextNodeData = DataService.nodeMap[DataService.contextNode];
                  cndata = _.reject(DataService.selected, function(d) { return d.id === DataService.contextNode });
              } else {
                  cndata = DataService.selected;
              }

              // group by type
              cndata = _.groupBy(cndata, function(d) { return d.type; });

              // construct a list of sorted arrays in an object keyed on type
              scope.contextNetworkData = {};
              angular.forEach(cndata, function(v, k) {
                  scope.contextNetworkData[k] = _.sortBy(v, function(d) { return d.name; });
              });

              // construct the array for csv download
              if (DataService.selected !== undefined) {
                  scope.construct('selected');
                  scope.selectionsDownload = true;
              } else {
                  // nothing selected so wipe it
                  console.log('here');
                  scope.selectedNodesData = undefined;
                  scope.selectionsDownload = false;
              }
          });

          // process the search data
          scope.$on('search-data-ready', function() {
                  angular.forEach(scope.data.types, function(v,k) {
                      scope.data.types[k].checked = false;
                  })
              d3s.highlightById('#site_graph', SolrService.selected);
          })

          scope.clearTypes = function() {
              angular.forEach(scope.data.types, function(v,k) {
                  scope.data.types[k].checked = false;
              })
          }
          scope.highlightByType = function(type) {
              scope.data.types[type].checked = !scope.data.types[type].checked;
              d3s.highlightByType('#site_graph', type);
          }
          
          // trigger a reset
          scope.reset = function() {
              // clear local state
              scope.clearTypes();
              scope.contextNodeData = undefined;
              scope.contextNetworkData = undefined;
              DataService.selected = undefined;
              DataService.contextNode = undefined;
              scope.showData = false;

              // reset the graph
              d3s.reset('#site_graph');

              // tag node sizing selected
              scope.sizeBy = [ "", "active", "", "" ];

              // tell search to clear
              $rootScope.$broadcast('reset-search');
          }

          // open up the entity network
          scope.viewEntityNetwork = function(id) {
              DataService.getEntityNetwork(id);
          }
          
          // toggle node labels
          scope.toggleLabels = function() {
              if (scope.labelsVisible === true) {
                  d3.select('#site_graph')
                    .selectAll('text')
                    .attr('class', 'hidden');
                  scope.labelsVisible = false;
              } else {
                  d3.select('#site_graph')
                    .selectAll('text')
                    .classed({ 'hidden': false });
                  scope.labelsVisible = true;
              }
          }
          
          // resize the nodes
          scope.sizeNodesBy = function(by) {
              if (by === 'evenly') {
                  scope.sizeBy = [ "active", "", "", "" ];
                  DataService.labelMainEntities('#site_graph', 'rByEntity');
              } else if (by === 'entities') {
                  scope.sizeBy = [ "", "active", "", "" ];
                  DataService.labelMainEntities('#site_graph', 'rByEntity');
              } else if (by === 'publications') {
                  scope.sizeBy = [ "", "", "active", "" ];
                  DataService.labelMainEntities('#site_graph', 'rByPublication');
              } else if (by === 'objects') {
                  scope.sizeBy = [ "", "", "", "active" ];
                  DataService.labelMainEntities('#site_graph', 'rByDobject');
              }
              d3s.sizeNodesBy(by, '#site_graph');
          }

          // panels to open in the accordion
          scope.panels = { 'activePanel': [2,3] }
        
          // tag node sizing selected
          scope.sizeBy = [ "", "active", "", "" ];

          // assemble the CSV
          scope.construct = function(what) {
              var d = [];
              if (what === 'selected') {
                  angular.forEach(DataService.selected, function(v,k) {
                      d.push([v.id, v.type, v.name, v.url]);
                  });
                  scope.selectedNodesData = d;
              } else if (what === 'unconnected') {
                  angular.forEach(scope.data.unConnected, function(v,k) {
                      angular.forEach(v, function(i, j) {
                        d.push([i.id, i.type, i.name, i.url]);
                      })
                  });
                  scope.unConnectedNodesData = d;
              }
          }
      }
    };
  }]);
