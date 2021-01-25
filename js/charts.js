/* 

  TallyLab's home-rolled d3-based charts, such as they are

  Note that the data being fed into this function is formatted elsewhere before arriving here, likely in lab.js or correlator.js

  Explanation of Inputs

    Required:
      chartType       string
      chartId         w/o '#'
      countData       array of objects in the form of { x: new Date(), y: number }, 
                      assumed to already be sorted by ascending date

    Options:
      color           hex code for now
      dateRangeStart  js Date obj
      dateRangeEnd    js Date obj
      margins         object in the form of { top: 10, right: 15, bottom: 10, left: 15 }
      xAxis           null hides the axis, otherwise the name of the axis (pretty much always Date/time)
      yAxis           null hides the axis, otherwise the name of the axis (counts, units, duration, whatevs)
      yUnits          this is context for the tooltips, e.g. '33 counts' or '10 minutes'

*/

function drawChart(chartType,chartId,countData,options){

  var settings = {
    color:          !options.color          ? '#333'                                       : options.color,
    dateRangeStart: !options.dateRangeStart ? countData[0].x                               : options.dateRangeStart,
    dateRangeEnd:   !options.dateRangeEnd   ? countData[countData.length-1].x              : options.dateRangeEnd,
    margins:        !options.margins        ? { top: 10, right: 15, bottom: 10, left: 15 } : options.margins,
    xAxis:          !options.xAxis          ? null                                         : options.xAxis,
    yAxis:          !options.yAxis          ? null                                         : options.yAxis,
    yUnits:         !options.yUnits         ? ''                                           : options.yUnits,
    period:         !options.period         ? ''                                           : options.period
  };

  if ( settings.yAxis ) { settings.margins.left = settings.margins.left+15; }

  if ( settings.yUnits.indexOf(' per ') !== -1 ){ settings.yUnits = settings.yUnits.split(' per ')[0]; }

  // Chart deets
  var width  = $('#'+chartId).width() - settings.margins.right;
  var height = $('#'+chartId).height() - settings.margins.top - settings.margins.bottom;
  var x      = d3.scaleTime().domain([settings.dateRangeStart,settings.dateRangeEnd]).range([0,width]);
  var y      = d3.scaleLinear().domain(d3.extent(countData, function(d){ return d.y; })).range([height,0]);
  var div    = d3.select("body").append("div").attr("class","d3-tooltip").style("opacity", 0);
  var chart, svg, g, enter; // Every chart has the same basic cast of characters

  switch(chartType){

    case "timeline":

      y.domain([0,2]); // With counts only, the y value is always 1, so we want it centered vertically

      chart = d3.select("#"+chartId);
      chart.selectAll('svg').remove();

      svg   = chart.append("svg")
              .attr("width",width + settings.margins.right + settings.margins.left)
              .attr("height",height + settings.margins.top + settings.margins.bottom);

      g     = svg.append("g").attr("transform","translate(" + settings.margins.left + "," + settings.margins.top + ")");

      enter = g.selectAll(".point").data(countData).enter();
      enter.append("circle")
            .attr("class", "point").attr("r", 5).attr('stroke', 'none').style('fill', settings.color).style('opacity',0.5)
            .attr("cy", function(d){ return y(d.y); })
            .attr("cx", function(d){
              var xVal = x(d.x) > width ? "-0" : x(d.x);
              return xVal;
            })
            .on("mouseover",function(d){
                div.transition().duration(200).style("opacity", 0.9);
                div.html(moment(d.x).format('MM/DD/YYYY'))
                  .style("left", (d3.event.pageX - 45) + "px")
                  .style("top", (d3.event.pageY - 30) + "px");
              })
            .on("mouseout",function(d){
                div.transition().duration(500).style("opacity", 0);
            });

      break; // event-drops

    case "line":

      //TODO Add "empty" periods?

      var line = d3.line()
                  .defined(function(d){ 
                    return d.hasOwnProperty('y') && d.y !== null && !isNaN(d.y) && d.x <= settings.dateRangeEnd && d.x >= settings.dateRangeStart;
                  })
                  .x(function(d) { return x(d.x); })
                  .y(function(d) { return y(d.y); });

      chart = d3.select('#'+chartId);
      chart.selectAll('svg').remove();

      svg   = chart.append("svg").datum(countData)
              .attr("width",width + settings.margins.right + settings.margins.left)
              .attr("height",height + settings.margins.top + settings.margins.bottom);

      g     = svg.append("g").attr("transform", "translate(" + settings.margins.left + "," + settings.margins.top + ")");

      enter = g.selectAll(".point").data(countData.filter(function(d) { return d; })).enter();
      enter.append("circle")
            .attr("class", "point").attr('fill','#fff').attr('stroke','none').attr("r", 5)
            .attr("cx", line.x()).attr("cy", line.y())
            .on("mouseover",function(d){
                div.transition().duration(200).style("opacity", 0.9);
                div.html(moment(d.x).format('MM/DD/YYYY') + "<br/>" + _.round(d.y,1) + " "+ settings.yUnits)
                  .style("left", (d3.event.pageX - 45) + "px")
                  .style("top", (d3.event.pageY - 45) + "px");
              })
            .on("mouseout",function(d){
                div.transition().duration(500).style("opacity", 0);
            });

      g.append("path")
          .attr("d", line).attr("class","line").attr('fill','none').attr('stroke',settings.color).attr('stroke-linecap','round').attr('stroke-width',1.5);

      break; // time-series

    case "scatter-plot":

      chart = d3.select("#"+chartId);
      chart.selectAll('svg').remove();

      svg   = chart.append("svg")
              .attr("width",width + settings.margins.right + settings.margins.left)
              .attr("height",height + settings.margins.top + settings.margins.bottom);

      g     = svg.append("g").attr("transform","translate(" + settings.margins.left + "," + settings.margins.top + ")");

      enter = g.selectAll(".point").data(countData).enter();
      enter.append("circle")
            .attr("class", "point").attr("r", 5).attr('stroke', 'none').attr('fill', settings.color)
            .attr("cy", function(d){ return y(d.y); })
            .attr("cx", function(d){
              var xVal = x(d.x) > width ? "-0" : x(d.x);
              return xVal;
            })
            .on("mouseover",function(d){
                div.transition().duration(200).style("opacity", 0.9);
                div.html(moment(d.x).format('MM/DD/YYYY') + "<br/>" + _.round(d.y,1) + " "+ settings.yUnits)
                  .style("left", (d3.event.pageX - 45) + "px")
                  .style("top", (d3.event.pageY - 45) + "px");
              })
            .on("mouseout",function(d){
                div.transition().duration(500).style("opacity", 0);
            });

      break; // scatter-plot

    case "scatter-plot-with-trendline":

      chart = d3.select("#"+chartId);
      chart.selectAll('svg').remove();

      svg   = chart.append("svg")
              .attr("width",width + settings.margins.right + settings.margins.left)
              .attr("height",height + settings.margins.top + settings.margins.bottom);

      g     = svg.append("g").attr("transform","translate(" + settings.margins.left + "," + settings.margins.top + ")");

      enter = g.selectAll(".point").data(countData).enter();
      enter.append("circle")
            .attr("class", "point").attr("r", 5).attr('stroke', 'none').attr('fill', settings.color)
            .attr("cy", function(d){ return y(d.y); })
            .attr("cx", function(d){
              var xVal = x(d.x) > width ? "-0" : x(d.x);
              return xVal;
            })
            .on("mouseover",function(d){
                div.transition().duration(200).style("opacity", 0.9);
                div.html(moment(d.x).format('MM/DD/YYYY') + "<br/>" + _.round(d.y,1) + " "+ settings.yUnits)
                  .style("left", (d3.event.pageX - 45) + "px")
                  .style("top", (d3.event.pageY - 45) + "px");
              })
            .on("mouseout",function(d){
                div.transition().duration(500).style("opacity", 0);
            });

      /* Trendline shananigans courtesy http://bl.ocks.org/benvandyke/8459843 */

        var decimalFormat = d3.format("0.2f");

        var xLabels = countData.map(function(d){ return d.x; });

        // get the x and y values for least squares
        var xSeries = d3.range(1, xLabels.length + 1);
        var ySeries = countData.map(function(d) { return d.y; });

        var leastSquaresCoeff = leastSquares(xSeries, ySeries);

        // apply the reults of the least squares regression
        var x1 = xLabels[0];
        var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
        var x2 = xLabels[xLabels.length - 1];
        var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
        var trendData = [[x1,y1,x2,y2]];

        var trendline = svg.selectAll(".trendline").data(trendData);
        var trendlineEnter = trendline.enter();
            trendlineEnter.append("line")
                          .attr("class", "trendline")
                          .attr("x1", function(d) { return x(d[0]); })
                          .attr("y1", function(d) { return y(d[1]); })
                          .attr("x2", function(d) { return x(d[2]); })
                          .attr("y2", function(d) { return y(d[3]); })
                          .attr("stroke", "black")
                          .attr("stroke-width", 1);

        // Remove previous equations
        $('#'+chartId).closest('.chart-row').find('.chart-name .equation').remove();

        // display equation on the chart
        $('#'+chartId).closest('.chart-row').find('.chart-name').append(' <span class="equation label" style="background-color:'+settings.color+'">y = ' + decimalFormat(leastSquaresCoeff[0]) + 'x + ' + decimalFormat(leastSquaresCoeff[1]) + '</span> ');

      break;

    case "gantt":

      chart = d3.select("#"+chartId);
      chart.selectAll('svg').remove();

      svg   = chart.append("svg")
              .attr("width",width + settings.margins.right + settings.margins.left)
              .attr("height",height + settings.margins.top + settings.margins.bottom);

      g     = svg.append("g").attr("transform","translate(" + settings.margins.left + "," + settings.margins.top + ")");

      enter = g.selectAll(".gantt-bar").data(countData).enter();
      enter.append("rect")
            .attr("class", "gantt-bar").attr('fill',settings.color).attr('opacity',0.6)
            .attr('x', function(d){ return x(d.x); })
            .attr('width',function(d){ 
              var gbw = x(d.y) - x(d.x);
              if ( gbw > 0 && gbw < 3){ // min-width of 3px for visibility
                gbw = 3;
              }
              return gbw;
            })
            .attr('y',settings.margins.top)
            .attr('height',height - settings.margins.bottom)
            .on("mouseover",function(d){
                div.transition().duration(200).style("opacity", 0.9);
                div.html(function(){
                  var dur = moment(d.y).valueOf() === 0 ? 0 : moment(d.y).valueOf()-moment(d.x).valueOf();
                  return moment(d.x).format('MM/DD/YYYY') + "<br/>" + _.round(moment.duration(dur).as(settings.yUnits),1) + " "+ settings.yUnits;
                })
                  .style("left", (d3.event.pageX - 45) + "px")
                  .style("top", (d3.event.pageY - 45) + "px");
              })
            .on("mouseout",function(d){
                div.transition().duration(500).style("opacity", 0);
            });

      break;

    case "vertical-bar":

      /* 
        Note: Vertical bar is *only* for counts-per-period currently; if other data-types are added later,
        the bar width will need to be calculated differently.
      */

      chart = d3.select("#"+chartId);
      chart.selectAll('svg').remove();

      svg = chart.append("svg")
            .attr("width",width + settings.margins.right + settings.margins.left)
            .attr("height",height + settings.margins.top + settings.margins.bottom);

      g   = svg.append("g").attr("transform","translate(" + settings.margins.left + "," + settings.margins.top + ")");

      enter = g.selectAll(".bar").data(countData).enter();
      enter.append("rect").attr("class", "bar").attr('fill',settings.color).attr('stroke','white')
            .attr('x', function(d){
              if ( x(d.x) < 0 ) {
                return 0;
              } else {
                return x(d.x);
              }
            })
            .attr('width',function(d){
              var start = x(d.x) < 0 ? 0 : x(d.x);
              var end = moment(d.x).add(periodReference[settings.period].number,periodReference[settings.period].period).toDate();
              if ( end < settings.dateRangeEnd ) {
                return x(end) - start;
              } else {
                return x(settings.dateRangeEnd) - start;
              }
            })
            .attr('y', function(d){ return y(d.y); })
            .attr('height', function(d){ return height - y(d.y); })
            .on("mouseover",function(d){
                div.transition().duration(200).style("opacity", 0.9);
                div.html(moment(d.x).format('MM/DD/YYYY') + "<br/>" + _.round(d.y,1) + " "+ settings.yUnits)
                  .style("left", (d3.event.pageX - 45) + "px")
                  .style("top", (d3.event.pageY - 45) + "px");
              })
            .on("mouseout",function(d){
                div.transition().duration(500).style("opacity", 0);
            });

      break;

    case 'correlatorXaxes':

      var axisA = d3.select("#topAxisChart");
          axisA.selectAll('svg').remove();

      var svgA = axisA
                  .append("svg")
                    .attr("width",width + settings.margins.right + settings.margins.left)
                    .attr("height",40);

                  svgA.append("g")
                    .attr("transform", "translate("+ settings.margins.left +",0)")
                    .call(d3.axisBottom(x).scale(x));

                  svgA.selectAll("text")
                    .attr("y",5).attr("x",-20)
                    .attr("transform", "rotate(-50)");

      var axisB = d3.select("#bottomAxisChart");
          axisB.selectAll('svg').remove();

      var svgB = axisB
                  .append("svg")
                    .attr("width",width + settings.margins.right + settings.margins.left)
                    .attr("height",45);

          svgB.append("g")
            .attr("transform", "translate("+ settings.margins.left +",40)")
            .call(d3.axisTop(x).scale(x));

          svgB.selectAll("text")
            .attr("y",-5).attr("x",20)
            .attr("transform", "rotate(-50)");

      break; // correlatorXaxes

  } // switch chartType

  if ( settings.xAxis ){

    var axisBottom = d3.select("#"+chartId+"BottomAxisChart");
        axisBottom.selectAll('svg').remove();

    var svgBottom = axisBottom.append("svg")
                      .attr("width",width + settings.margins.right + settings.margins.left)
                      .attr("height",45);

    var gBottom = svgBottom.append("g")
          .attr("transform", "translate("+ settings.margins.left +",40)")
          .call(d3.axisTop(x).scale(x));

        gBottom.selectAll("text")
          .attr("y",-5).attr("x",20)
          .attr("transform", "rotate(-50)");
  }

  if ( settings.yAxis ){

    g.call(d3.axisLeft(y).scale(y).tickPadding(3).tickSize(4).ticks(5));

  }

  // Set stats
  if ( chartType !== "timeline" && chartType !== "gantt" && chartType.indexOf('axes') === -1 ){  // TODO a version of this for gantt charts

    // We had to add an empty last count to force the chart to show "today", but we don't want that zero to skew the stats, so:
    var specialized = ( countData[countData.length-1].y === 0 ) ? countData.slice(0,countData.length-1) : countData;

    // Stats!
    var valArray = _.map(specialized,'y').sort(function(a, b) { return a - b; }),
        min      = _.round(valArray[0],2),
        max      = _.round(valArray[valArray.length-1],2),
        avg      = _.round(_.sum(valArray)/valArray.length,2),
        med      = _.round(median(valArray),2);
    $('#'+chartId).closest('.chart-row').find('.set-stats').remove();
    $('#'+chartId).closest('.chart-row').find('.chart-name').append('<span class="set-stats"><span class="label" style="background-color:'+settings.color+'">Min: ' + min + '</span> <span class="label" style="background-color:'+settings.color+'">Max: ' + max + '</span> <span class="label" style="background-color:'+settings.color+'">Avg: ' + avg + '</span> <span class="label" style="background-color:'+settings.color+'">Med: ' + med + '</span></span>');

  }

} // drawChart

// returns slope, intercept and r-square of the line
// via http://bl.ocks.org/benvandyke/8459843
function leastSquares(xSeries, ySeries) {

  var reduceSumFunc = function(prev, cur) { return prev + cur; };

  var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
  var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

  var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); }).reduce(reduceSumFunc);
  var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); }).reduce(reduceSumFunc);
  var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); }).reduce(reduceSumFunc);

  var slope = ssXY / ssXX;
  var intercept = yBar - (xBar * slope);
  var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

  return [slope, intercept, rSquare];
}

// end charts.js
