'use strict';

angular.module('interfaceApp')
  .service('D3Service', [ '$rootScope', 'configuration', 'DataService', 
    function D3Service($rootScope, conf, DataService) {

    // AngularJS will instantiate a singleton by calling "new" on this function
    
    /* 
     * @function: highlightNodeAndLocalEnvironment
     */
    function highlightNodeAndLocalEnvironment(contextNode, graphSelector) {
        var selections = [];
        if (d3s.contextNode === contextNode) {
            d3s.contextNode = undefined;
            d3s.reset(graphSelector);
            return;
        }

        // remove all landmark labels
        d3.select(graphSelector)
            .selectAll('.text_landmark')
            .remove();

        d3s.contextNode = contextNode;
        selections.push(contextNode);

        d3.select(graphSelector)
          .selectAll('.link')
          .each(function(d) {
            if (d.source.id === contextNode) {
              selections.push(d.target.id);
            } else if (d.target.id === contextNode) {
              selections.push(d.source.id);
            }
          })

        d3s.highlight(contextNode, selections);
        d3s.highlightLinks(contextNode, selections);
        d3s.labelSelections(graphSelector, selections);

        DataService.contextNode = selections[0];
        DataService.selected = selections;
        $rootScope.$broadcast('node-data-ready');
    }

    /*
     * @function: labelNodes
     */
    function labelSelections(graphSelector, selections) {
        angular.forEach(selections, function(v,k) {
            var d = d3.select(graphSelector)
               .select('#node_' + v)
               .each(function(d) {
                   var coords = DataService.determineLabelPosition(graphSelector, d);
                   d3.select(graphSelector).select('svg').select('g').append('text')
                     .attr('x', coords.x)
                     .attr('y', coords.y)
                     .attr('id', 'text_' + d.id)
                     .attr('class', 'text')
                     .attr('font-size', '20px')
                     .text(d.id);
               });
            })


    }

    /*
     * @function: highlightByType
     */
    function highlightByType(type) {
        if (d3s.type.indexOf(type) !== -1) {
            d3s.type.splice(d3s.type.indexOf(type), 1);
            d3s.reset();
            if (d3s.type.length === 0) { return; }
        } else {
            d3s.type.push(type);
        }

        var selections = [];
        d3.selectAll('.node')
          .each(function(d) {
              if (d3s.type.indexOf(d.type) !== -1) {
                  selections.push(d.id);
              }
           });

        d3s.highlight(undefined, selections);
        d3.selectAll('.link')
          .attr('opacity', conf.opacity.unselected);

        DataService.contextNode = undefined;
        DataService.selected = selections;
        $rootScope.$broadcast('node-data-ready');
    }

    /*
     * highlight
     */
    function highlight(contextNode, selections) {
        d3.selectAll('.node')
          .transition()
          .duration(500)
          .attr('fill', function(d) {
              if (selections.indexOf(d.id) !== -1) {
                  return d.color;
              } else {
                  return '#ccc';
              }
          })
          .style('stroke', function(d) {
              if (d.id === contextNode) {
                  return 'black'
              } else if (selections.indexOf(d.id) !== -1) {
                  return d.color; 
              } else {
                  return '#ccc';
              }
          })
          .attr('opacity', function(d) {
              if (selections.indexOf(d.id) !== -1) {
                  return conf.opacity.default;
              } else {
                  return conf.opacity.unselected;
              }
          });

        d3.selectAll('.date')
          .transition()
          .duration(500)
          .attr('opacity', function(d) {
              if (selections.indexOf(d.id) === -1) {
                  return 0;
              }
          })
          .style('stroke', function(d) {
              if (d.id === contextNode) {
                  return 'black'
              } else if (selections.indexOf(d.id) !== -1) {
                  return d.color;
              } else {
                  return '#ccc';
              }
          });
    }

    /*
     * highlightLinks
     */
    function highlightLinks(contextNode, selections) {
        d3.selectAll('.link')
          .transition()
          .duration(500)
          .style('stroke', function(d) {
              if (selections.indexOf(d.source.id) !== -1 && d.target.id === contextNode) {
                  return 'black';
              } else if (selections.indexOf(d.target.id) !== -1 && d.source.id === contextNode) {
                  return 'black';
              } else {
                  return '#ccc';
              }
          })
          .attr('opacity', function(d) {
              if (selections.indexOf(d.source.id) !== -1 && d.target.id === contextNode) {
                  return conf.opacity.default;
              } else if (selections.indexOf(d.target.id) !== -1 && d.source.id === contextNode) {
                  return conf.opacity.default;
              } else {
                  return conf.opacity.unselected;
              }
          });
    }

    /*
     * @function: reset
     */
    function reset(graphSelector) {
        d3.select(graphSelector)
          .selectAll('text')
          .remove();

        d3.select(graphSelector)
          .selectAll('.node')
          .transition()
          .duration(500)
          .attr('r', function(d) {
              return d.r;
          })
          .attr('fill', function(d) {
              return d.color;
          })
          .style('stroke', function(d) {
              return d.color;
          })
          .attr('opacity', function(d) {
              return conf.opacity.default;
          });
        d3.select(graphSelector)
          .selectAll('.link')
          .transition()
          .duration(500)
          .style('stroke', '#ccc')
          .attr('opacity', conf.opacity.default);

        d3.select(graphSelector)
          .selectAll('.date') 
          .transition()
          .duration(500)
          .attr('opacity', conf.opacity.default)
          .style('stroke', function(d) {
              return d.color;
          });

        DataService.labelMainEntities(graphSelector);
        DataService.contextNode = undefined;
        DataService.selected = [];
        $rootScope.$broadcast('node-data-ready');

    }

    /*
     * @function: sizeNodesBy
     */
    function sizeNodesBy(by, graphSelector) {
        d3.select(graphSelector)
          .selectAll('.node')
          .transition()
          .duration([750])
          .attr('r', function(d) {
              if (by === 'evenly') {
                  return '10';
              } else if (by === 'entities') {
                  return d.rByEntity;
              } else if (by === 'publications') {
                  return d.rByPublication;
              } else if (by === 'objects') {
                  return d.rByDobject;
              }
          });
    }

    /*
     * @function: resetNodeDimensions
     */
    function resetNodeDimensions() {
        d3.selectAll('.node')
          .transition()
          .attr('r', function(d) { return d.r; });
    }

    /*
     * @function: sanitize
     */
    function sanitize(selector) {
        var s = selector.replace(/\(|\)/g, '').replace(/ /g, '_');
        return s;
    }

    var d3s = {
        highlightedTypes: [],
        colors: d3.scale.category20(),
        highlightNodeAndLocalEnvironment: highlightNodeAndLocalEnvironment,
        highlightByType: highlightByType,
        highlight: highlight,
        highlightLinks: highlightLinks,
        sizeNodesBy: sizeNodesBy,
        labelSelections: labelSelections,
        resetNodeDimensions: resetNodeDimensions,

        reset: reset,
        sanitize: sanitize
    }
    d3s.fill = {};
    d3s.opacity = {};
    d3s.stroke = {};
    d3s.strokeWidth = {};
    d3s.height = {};
    d3s.contextNode = undefined;
    d3s.type = [];
    return d3s;

  }]);
