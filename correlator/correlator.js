var allCounts = [];

function drawCorrelator(){

  // Reset allCounts
  allCounts = [];

  $('#TLcorrelator .chart-row').each(function(i){

    // Get row data
    var chartRowData = $(this).data();

    // Get tally   
    var tally = tl.getTally({ 'slug' : chartRowData.tallySlug });

    // Get chartId
    var chartId = $(this).find('.chart').prop('id');

    // The Business
    addChartToCorrelator(tally,chartRowData,chartId);

  }); // each chart-row

  // Background grid needs everything to exist to be available
  var correlatorHeight = $('#bottomAxisChart').offset().top - $('#topAxisChart').offset().top - 10;
  var $ticks = $('#topAxisChart > svg').clone();
      $ticks.find('path,text').remove();
      $ticks.find('line').attr('y2',correlatorHeight).attr('stroke','#dedede');
      $ticks.attr('height',correlatorHeight).css({'position':'absolute','top':'25px','left':'15px'});
      $('#topAxisChart').append($ticks);

  // Show time range form
  $('#timeRangeForm,#addChartForm label').removeClass('hidden');

}

$wynduh.on('resize.correlator',function(){
  if ( $wynduh.width() != windowWidth) { // Check window width has actually changed and it's not just iOS triggering a resize event on scroll
    drawCorrelator();
  }
});

window.onorientationchange = function(){
  drawCorrelator();
};

function addChartToCorrelator(tally,chartData,chartId){

  // Remove previous chart(s) if any
  $('#topAxisChart, #bottomAxisChart, #'+chartId).empty();

  // Which color for this one?
  var hexdex = $('.chart').length-$('.chart').index($('#'+chartId))-1;
  var hex = colors[hexdex % colors.length];
  $('#'+chartId).closest('.chart-row').find('.chart-name a').css({ color: hex });

  // Sort counts
  var sortedCounts = _.orderBy(tally.counts,['startDate']);

  // Find time range
  var dateRangeStart, dateRangeEnd;
  if ( $('#dateRangeStart').val() === "" ) { 
    dateRangeStart = moment(sortedCounts[0].startDate);
    $('#dateRangeStart').val(dateRangeStart.format('YYYY-MM-DD'));
  } else {
    dateRangeStart = moment($('#dateRangeStart').val(),'YYYY-MM-DD');
  } 
  if ( $('#dateRangeEnd').val() === "" ) { 
    if ( chartData.chartType === "gantt" ){
      dateRangeEnd = !sortedCounts[sortedCounts.length-1].endDate ? moment() : moment(sortedCounts[sortedCounts.length-1].endDate);
    } else {
      dateRangeEnd = moment(sortedCounts[sortedCounts.length-1].startDate);
    }
    $('#dateRangeEnd').val(dateRangeEnd.format('YYYY-MM-DD'));
  } else {
    dateRangeEnd = moment($('#dateRangeEnd').val(),'YYYY-MM-DD');
  }

  // Filter counts to date range
  sortedCounts = _.filter(sortedCounts,function(count){ return count.startDate >= dateRangeStart.valueOf() && count.startDate <= dateRangeEnd.valueOf(); });

  if ( sortedCounts.length > 0 ) {

    // Counts-per and num-per are special cases that override
    if ( chartData.dataType === "counts-per" ) {
      sortedCounts = countsByPeriod(sortedCounts,tally.goalPeriod);
    } else if ( chartData.dataType === "num-per" ) {
      sortedCounts = countsByPeriod(sortedCounts,tally.goalPeriod,'number');
    }

    // Format data
    var formattedCounts = [];
    _.forEach(sortedCounts,function(data,index){

      // Defaults are for counts-only timeline
      var date = new Date(data.startDate), num = 1;

      // Numbers are easy
      if ( chartData.dataType === "numbers" ) {
        num = parseFloat(data.number);
      }

      // Words are also pretty easy
      if ( chartData.dataType === "words" ) {
        num = data.note.replace(/\s\s+/g,' ').split(' ').length;
      }

      // Durations depend on type of chart as well
      else if ( chartData.dataType === "durations" ){

        var endDate = !data.endDate ? moment().valueOf() : data.endDate;

        if ( chartData.chartType === "gantt"){
          num = new Date(endDate);
        } else {
          var dur = endDate - data.startDate;
          num = moment.duration(dur).as(chartData.yUnits);
        }

      }

      // Counts-per require the date of the period, not the date of the count
      else if ( chartData.dataType === "counts-per" || chartData.dataType === "num-per" ){
        date = moment(data.startDate,periodReference[tally.goalPeriod].format).toDate();
        num = parseFloat(data.number);
      }

      // Ledger
      allCounts.push({startDate:date,num:1});

      // Chart
      formattedCounts.push({
        x: date,
        y: num
      });

    });

    // Draw x-axes
    var axesOptions = {
      dateRangeStart: dateRangeStart.toDate(),
      dateRangeEnd: dateRangeEnd.toDate()
    };
    drawChart('correlatorXaxes','topAxisChart',formattedCounts,axesOptions);

    // Draw chart
    var chartOptions = {
      color:          hex,
      dateRangeStart: dateRangeStart.toDate(),
      dateRangeEnd:   dateRangeEnd.toDate(),
      yUnits:         chartData.yUnits,
      period:         chartData.period
    };
    drawChart(chartData.chartType,chartId,formattedCounts,chartOptions);

  } else {

    $('#'+chartId).append('<div class="alert alert-danger status-messaging">There are no counts for this tally in the current date range.</div>');

  }

} // addChartToCorrelator

function loadCorrelator() {

  var $addChartForm = $('#addChartForm'),
      $chooseTally  = $addChartForm.find('.choose-tally'),
      $chooseData   = $addChartForm.find('.choose-data'),
      $chooseChart  = $addChartForm.find('.choose-chart'),
      $addChartBtn  = $addChartForm.find('.add-chart');

  // Add all tallies to select box
  var tallyList = _.sortBy(tl.tallies,['title']);
  _.forEach(tallyList,function(data,index){ 
    if ( data.counts.length > 0 ){
      var option = '<option value="'+data.slug+'">'+data.title+'</option>';
      $chooseTally.append(option);
    }
  });

  /* Conditionally show/hide form elements */

    // Once user chooses a tally...
    $chooseTally.on('change',function(){

      // If a tally was chosen...
      if ( $chooseTally.find('option:selected').val() !== "none" ){

        // Preview the tally data
        var tally = tl.getTally({ 'slug' : $chooseTally.find('option:selected').val() });
        var goalPeriod = tally.goalPeriod !== "day" ? tally.goalPeriod : "day";

        // Which counts have numeric values?
        var countsWithNums = _.filter(tally.counts,function(o){
          return ( typeof o.number !== "undefined" && o.number !== null && o.number !== "" );
        });

        // Which counts have end stamps?
        var countsWithEnds = _.filter(tally.counts,function(o){
          return ( typeof o.endDate !== "undefined" && o.endDate !== null && o.endDate !== "" );
        });

        // Which counts have notes?
        var countsWithNotes = _.filter(tally.counts,function(o){
          return ( typeof o.note !== "undefined" && o.note !== null && o.note !== "" );
        });

        // If we have more than one count with a number, numbers are fair game
        $chooseData.find('option:gt(2)').remove();
        if ( countsWithNums.length > 1 ){
          var units  = tally.value !== "" ? tally.value : "Numeric value";
          var cUnits = units.charAt(0).toUpperCase() + units.slice(1);
          $chooseData.append('<option value="numbers">'+cUnits+'</option>');
          $chooseData.append('<option value="num-per">'+cUnits+' per '+goalPeriod);
        }

        // If we have more than one count with a endDate, duration is fair game
        $chooseData.find('option[value="durations"]').remove();
        if ( countsWithEnds.length > 1 ){
          $chooseData.append('<option value="durations">Durations</option>');
        }

        // If we have more than one count with a note, words are fair game
        $chooseData.find('option[value="words"]').remove();
        if ( countsWithNotes.length > 1 ){
          $chooseData.append('<option value="words">Word Count</option>');
        }

        // Update counts per goal period to be something other than day if applicable
        $chooseData.find('option[value="counts-per"]').text('Counts per '+goalPeriod);

        // Show data select
        $chooseData.removeClass('hidden');
      }

      // Otherwise we're back to square one
      else {
        $addChartForm.find('select:not(.choose-tally)').addClass('hidden');
        $addChartBtn.prop('disabled',true);
      }

    }); // choose-tally onchange

    // Tally visibility of "choose chart type" dropdown dependning on whether user has chosen data to chart
    $chooseData.on('change',function(){

      // Hide all of 'em
      $chooseChart.find('option:not([value=none])').remove();

      var allowedCharts = {
        "counts"     : ['timeline'],
        "counts-per" : ['line','scatter-plot','scatter-plot-with-trendline','vertical-bar'],
        "numbers"    : ['line','scatter-plot','scatter-plot-with-trendline'],
        "num-per"    : ['line','scatter-plot','scatter-plot-with-trendline','vertical-bar'],
        "durations"  : ['line','scatter-plot','scatter-plot-with-trendline','gantt'],
        "words"      : ['line','scatter-plot','scatter-plot-with-trendline','vertical-bar']
      };

      if ( $chooseData.find('option:selected').val() === "none" ){
        $chooseChart.addClass('hidden');
        $addChartBtn.prop('disabled',true);
      } else {
        var chartType = $chooseData.find('option:selected').val();
        _.forEach(allowedCharts[chartType],function(chart,i){
          var chartText = chart.replace(/-/g,' ');
          $chooseChart.append('<option value="'+chart+'">'+_.capitalize(chartText)+'</option>');
        });
        $chooseChart.removeClass('hidden');
      }

    }); // choose-data onchange

    // Toggle visibility of "add chart" button depending on whether user has chosen a chart type
    $chooseChart.on('change',function(){

      if ( $chooseChart.find('option:selected').val() === "none" ){
        $addChartBtn.prop('disabled',true);
      } else {
        $addChartBtn.prop('disabled',false);
      }

    });

  $addChartForm.on('submit',function(e){
    e.preventDefault();

    // Get tally
    var tally = tl.getTally({ 'slug' : $chooseTally.find('option:selected').val() });

    // Get data type
    var dataType = $chooseData.find('option:selected').val();

    // Get chart type
    var chartType = $chooseChart.find('option:selected').val();

    // DOM comes relatively early in this context because of d3 reqs
    var newChartIndex = $('.chart-row').length+1;
    var newChartId = 'chart'+newChartIndex;
    var newChartUnits = 'counts';
    if ( dataType === 'counts-per' ){
      newChartUnits = 'counts per '+tally.goalPeriod;
    } else if ( dataType === 'num-per' ){
      newChartUnits = tally.value+' per '+tally.goalPeriod;
    } else if ( dataType === 'numbers' && tally.value !== '' ){
      newChartUnits = tally.value;
    } else if ( dataType === 'durations' ){
      newChartUnits = durationUnits(tally);
    } else if ( dataType === 'words' ){
      newChartUnits = 'words';
    }
    var unitsHtml = newChartUnits.length > 0 ? ' <span class="value">'+newChartUnits+'</span> ' : ' ';
    $('#topAxis').after('<div class="chart-row row" data-chart-index="'+newChartIndex+'" data-tally-slug="'+tally.slug+'" data-data-type="'+dataType+'" data-chart-type="'+chartType+'" data-y-units="'+newChartUnits+'" data-period="'+tally.goalPeriod+'"><div class="col-md-2 col-sm-12"><div class="chart-name vertical-align"><a class="title" href="/app/lab/index.html?tab=data&collection=all-tallies&tally='+tally.slug+'">'+tally.title+'</a>'+unitsHtml+'</div></div><div class="col-md-10 col-sm-12"><div id="'+newChartId+'" class="chart"></div></div></div>');

    drawCorrelator();

    // Reset "add chart" form
    $addChartForm.find('form')[0].reset();
    $addChartBtn.prop('disabled',true);
    $addChartForm.find('form select:not(.choose-tally)').addClass('hidden');

    return false;
  }); // add-chart press

  // If the date has changed, we gotta redraw every chart

  $('#timeRangeForm form').on('submit',function(e){
    e.preventDefault();

    drawCorrelator();

    return false;
  }); // date change

  $('#TLcorrelator').removeClass('hidden');

  $('#pageLoaderContainer').addClass('hidden');
  
  document.removeEventListener('sync',loadCorrelator);
}

function loadCollectionCharts(){

  // Which collection?
  var collection = tl.getCollection({ 'slug' : URLParser(location.href).getParam('collection') });

  // Fetch tallies into array
  var tallies = [], counts = [];
  _.forEach(collection.tallies,function(id){
    var tally = tl.getTally({ 'id' : id });
    if ( tally && tally.counts.length > 0 ) {
      tallies.push(tally);
      counts = _.concat(counts,tally.counts);
    }
  });

  if ( counts.length > 0 ){

    /* Establish Time Range */

      var allCounts = _.orderBy(counts,['startDate']);

      var dateRangeStart = moment(allCounts[0].startDate);
      $('#dateRangeStart').val(dateRangeStart.format('YYYY-MM-DD'));

      var dateRangeEnd = moment(allCounts[allCounts.length-1].startDate);
      $('#dateRangeEnd').val(dateRangeEnd.format('YYYY-MM-DD'));

    if ( dateRangeEnd-dateRangeStart > 86400000 ){

      // Initial sort
      var sortedTallies = _.orderBy(tallies,['title'],['asc']);

      _.forEach(sortedTallies,function(tally,i){

        if ( tally.counts.length > 2 ){

          var sortedCounts = _.orderBy(tally.counts,['startDate']);

          // Determine data type
          var chartData = smartChart(tally,sortedCounts);

          // Determine chart type
          var chartType;
          switch(chartData.dataType){
            case 'counts-per': chartType = 'vertical-bar'; break;
            case 'numbers'   : chartType = 'line';         break;
            case 'num-per'   : chartType = 'vertical-bar'; break;
            case 'durations' : chartType = 'line';        break;
            default          : chartType = 'timeline';
          }

          // DOM comes relatively early in this context because of d3 reqs
          var newChartIndex = $('.chart-row').length+1;
          var newChartId = 'chart'+newChartIndex;
          var unitsHtml = ' <span class="value">'+chartData.yUnits+'</span>';
          $('#bottomAxis').before('<div class="chart-row row" data-chart-index="'+newChartIndex+'" data-tally-slug="'+tally.slug+'" data-data-type="'+chartData.dataType+'" data-chart-type="'+chartType+'" data-y-units="'+chartData.yUnits+'" data-period="'+tally.goalPeriod+'"><div class="col-md-2 col-sm-12"><div class="chart-name vertical-align"><a class="title" href="/app/lab/index.html?tab=data&collection=all-tallies&tally='+tally.slug+'">'+tally.title+'</a>'+unitsHtml+'</div></div><div class="col-md-10 col-sm-12"><div id="'+newChartId+'" class="chart"></div></div></div>');

        }

      }); // each tally

      drawCorrelator();

      $('#timeRangeForm form').on('submit',function(e){
        e.preventDefault();

        drawCorrelator();

        return false;
      }); // date change

    } else {

      $('#linkToCorrelator').hide();
      $('#TLcorrelator').append('<p class="alert alert-danger">Your data has to be at least a day old for us to make a chart here worth looking at. Check the Correlator for more granular options!<span style="display:block;text-align:center;"><a class="btn btn-default btn-lg" href="/app/correlator">Check the Correlator</a></p>');

    }

  } else {

    $('#linkToCorrelator').hide();
    $('#TLcorrelator').append('<p class="alert alert-danger">You don\'t have enough data yet for us to generate any charts. Get tallying!</p>');

  }

  $('#TLcorrelator').removeClass('hidden');

  return counts.lenght;

} // loadCollectionCharts

// end correlator.js