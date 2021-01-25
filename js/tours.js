var collectionTour = {
  //"debug": true,
  "name": "collectionTour",
  "backdrop": true,
  "template": "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'> <button class='btn btn-default prev' data-role='prev'>« Prev</button> <button class='btn btn-default next' data-role='next'>Next »</button>  </div><button class='btn btn-default' data-role='end'>End tour</button></div>",
  "steps": [
    {
      "title": "Collection Tour",
      "orphan": true,
      content: function(){
        var counts = _.some(tl.tallies,function(t){ return t.counts.length > 0; });
        if ( !counts ){
          return "Each section of the app contains an introductory tour that will automatically launch on your first visit. If you get interrupted, you can always continue or restart the tour later by clicking the link in the footer.<br /><br />Ready to learn about your new collection?";
        } else {
          return "This tour will walk you through the functionality of a collection.";
        }
      }
    },
    {
      "title": "Collection Name",
      "element": "#theCollection h1 span",
      "placement": "bottom",
      "content": "Here's the name of this collection"
    },
    {
      "title": "Collection Tabs",
      "element": "#theCollection .nav.nav-tabs",
      "placement": "bottom",
      "content": "We're currently looking at this collection's tallies, but you can also view charts and settings for each collection."
    },
    {
      "title": "Tallies",
      "element": "#tallies",
      "placement": "top",
      "content": "A <em>tally</em> is anything you want to track – e.g. taking a vitamin, times you've gone skydiving, or potholes on your street."
    },
    {
      "title": "Tally Name",
      "element": "#tallies .tally.box:eq(0) [name=title]",
      "placement": "top",
      "content": "This is the tally's name.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Counts",
      "element": "#tallies .tally.box:eq(0) .count",
      "placement": "bottom",
      "content": "This number is showing you how many times you've added a count to this tally. A count is a tracked moment in time.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Add Count",
      "element": "#tallies .tally.box:eq(0) .add-count:not(.hidden) svg",
      "placement": "bottom",
      "content": "This button adds a count. Go ahead and click it!<br /><br /><strong>Tip:</strong> If this tally had been set up to be a timer, the \"plus\" sign would instead be a \"play\" sign which would both add a count and start the timer.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Timer Tallies",
      "element": "#tallies .tally.box:eq(0) .start-timer:not(.hidden) svg",
      "placement": "bottom",
      "content": "Because this tally is set up to be a timer, the \"play\" button here adds a count AND starts the timer.<br /><br /><strong>Tip:</strong> If this tally were not set up to be a timer, it would have a plus sign here instead of the play sign, and "+pressLabelLowercase+pressLabelExtra+"ing it would just add a count.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Delete a Count",
      "element": "#tallies .tally.box:eq(0) .sub-count svg",
      "placement": "bottom",
      "content": "The minus sign allows you to delete the most recent count in a tally. Give it a try!",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Most Recent Count",
      "element": "#tallies .tally.box:eq(0) .last-update",
      "placement": "bottom",
      "content": "This is the last time you added a count to this tally.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Duration",
      "element": "#tallies .tally.box:eq(0) .timer",
      "placement": "bottom",
      "content": "Since this tally is a timer, you also see the duration for your last count.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Numeric Value",
      "element": "#tallies .tally.box:eq(0) .numeric-value",
      "placement": "bottom",
      "content": "Clearly you already know what this is because you have one here, but just in case: Numeric Values add another dimension to your count data. If you're tracking runs, you can add miles; if you're tracking vitamins, you can add dosage; if you're tracking sleep, you can add a quality rating.<br /><br />Whenever you add a new count for this tally, you'll be automatically prompted to add a numeric value.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Tally Tags",
      "element": "#tallies .tally.box:eq(0) .tl-tag:eq(0)",
      "placement": "bottom",
      "content": "You can tag your tallies with anything you like. Why would you do so?<br /><br />For collections with lots of tallies, tags can help you filter the list to find a particular tally.<br /><br />You can also use tags in your analysis later, as an additional dimension for comparison.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Tally Stats",
      "element": "#tallies .tally.box:eq(0) .view-stats .glyphicons",
      "content": "The icon in the lower left corner of each tally box will take you to that tally's stats.<br /><br />Tally stats are things like the average duration of your counts, the most counts you had in a month – whatever you've configured a tally to track.",
      "placement": "right",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Tally Settings",
      "element": "#tallies .tally.box:eq(0) .view-settings .glyphicons",
      "content": "The icon in the lower right corner of each tally box will take you to that tally's settings.",
      "placement": "left",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Tally Detail",
      "element": "#tallies .tally.box:eq(0) [name='title']",
      "placement": "top",
      "content": "Clicking the name of the tally will take you to the tally's detail view, where you can edit an individual count.<br /><br />For example, maybe you are adding it at a later date and you need to edit the time.",
      onShow: function(){
        $("#tallies .tally.box:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Tally Box Colors Explained",
      "element": "#tallies .tally.box:eq(0)",
      "placement": "bottom",
      "content": "The color of each tally box is an indication of where you stand with regard to this tally's goal.<br /><br />If the box is <span class='text-success'><strong>green</strong></span>, that means you've overmet the goal. If the box is <span class='text-primary'><strong>blue</strong></span>, it means that you've just met the goal. If the box is <span class='text-danger'><strong>red</strong></span>, it means that you haven't reached the goal yet.<br /><br /><strong>Tip:</strong> If you don't have a goal set up for a particular tally, it will always be <span class='text-purple'><strong>purple</strong></span>."
    },
    {
      "title": "Create a New Tally",
      "element": "#tallies .new.tally.box",
      "placement": "top",
      "content": "The last box in every list of tallies is a wizard that will walk you through setting up a new tally. It's basically a more fun version of the Tally Settings view."
    }
  ]
}; // collectionTour

var collectionChartsTour = {
  //"debug": true,
  "name": "collectionChartsTour",
  "backdrop": true,
  "template": "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'> <button class='btn btn-default prev' data-role='prev'>« Prev</button> <button class='btn btn-default next' data-role='next'>Next »</button>  </div><button class='btn btn-default' data-role='end'>End tour</button></div>",
  "steps": [
    {
      "title": "Collection Charts Tour",
      "orphan": true,
      "content": "Ready to learn about collection charts?<br /><br />If you get interrupted, you can always continue or restart the tour later by clicking the link in the footer."
    },
    {
      "title": "Compare a Collection's Tallies",
      "element": "#TLcorrelator",
      "placement": "top",
      "content": "The collection chart view shows charts for all of the tallies in this collection."
    },
    {
      "title": "Default Time Range",
      "element": "#timeRangeForm",
      "placement": "top",
      "content": "The time range defaults to include every count from every tally, but you can zoom in on any timeframe at all."
    },
    {
      "title": "Smart Chart",
      "element": "#TLcorrelator .chart-row[data-chart-index=1]",
      "placement": "top",
      "content": "We've tried to be smart about which data to show you from each tally, and which chart to use..."
    },
    {
      "title": "Not-So-Smart Chart",
      "element": "#collCharts .btn.btn-block.btn-lg.btn-primary",
      "placement": "top",
      "content": "...but if you disagree with our choices, try out the Correlator, which gives you full control."
    }
  ]
}; // collectionChartsTour

var tallyDataTour = {
  //"debug": true,
  "name": "tallyDataTour",
  "backdrop": true,
  "template": "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'> <button class='btn btn-default prev' data-role='prev'>« Prev</button> <button class='btn btn-default next' data-role='next'>Next »</button>  </div><button class='btn btn-default' data-role='end'>End tour</button></div>",
  "steps": [
    {
      "title": "Tally Detail Tour",
      "orphan": true,
      "content": "Ready to learn about tally counts?<br /><br />If you get interrupted, you can always continue or restart the tour later by clicking the link in the footer."
    },
    {
      "title": "Tally Detail",
      "element": "#theTally .tally.box:eq(0)",
      "placement": "bottom",
      "content": "Every tally detail view repeats the tally box at the top."
    },
    {
      "title": "Tally Data",
      "element": "#counts",
      "placement": "top",
      "content": "This is a list of every count in this tally."
    },
    {
      "title": "Counts",
      "element": "#counts .count:eq(0)",
      "placement": "top",
      "content": "Each entry in this list represents one count."
    },
    {
      "title": "Count Index",
      "element": "#counts .count:eq(0) .dropdown",
      "content": "This was the Nth time you tracked a moment for this tally.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(){
        $("#counts .count:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Start date/time",
      "element": "#counts .count:eq(0) .timestamps.start .glyphicons",
      "content": "If this tally is not a timer, this date/time represents the moment you added the count. If this tally is a timer, the date represents the moment you started the timer.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(){
        $("#counts .count:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "End date/time",
      "element": "#counts .count:eq(0) .timestamps.end .glyphicons",
      "content": "This was when the count ended.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(){
        $("#counts .count:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Duration",
      "element": "#counts .count:eq(0) .durations .glyphicons",
      "content": "This is the total duration for this count – start time to end time.<br /><br />You can't edit this number directly yet (coming soon!) but you can edit either the start time or end time and this number will update automatically.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(){
        $("#counts .count:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Numeric Value",
      "element": "#counts .count:eq(0) .values .glyphicons",
      "content": "This is the numeric value you entered for this count.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(tour){
        $("#counts .count:eq(0)").addClass('tour-step-backdrop');
      }
    },
    {
      "title": "Count Menu",
      "element": "#counts .count:eq(0) .dropdown",
      "content": "There's an entire menu of things you can add to a count by "+pressLabelLowercase+pressLabelExtra+"ing the count index.<br /><br />Maybe you set up a pretty barebones tally to start with, so none of these fields are visible when you first come to look at your list of counts. No prob, just "+pressLabelLowercase+" the index of any count to see a menu of things you can add/edit.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(tour){
        $("#counts .count:eq(0)").addClass('tour-step-backdrop');
      },
      onShown: function(tour){
        $('#counts .count:eq(0) .dropdown').addClass('open');
      },
      onHide: function(tour){
        $('#counts .count:eq(0) .dropdown').removeClass('open');
      }
    },
    {
      "title": "Count Notes",
      "element": "#counts .count:eq(0) [name=note]",
      "content": "You can also add a note to any count.<br /><br />Maybe you didn't enter this count until long after the actual moment it occurred; you could use this space to make a note that the data for this count is from memory.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'bottom'; },
      onShow: function(tour){
        $("#counts .count:eq(0)").addClass('tour-step-backdrop');
        $('#counts .count:eq(0) .notes').removeClass('hidden');
      },
      onHide: function(tour){
        $('#counts .count:eq(0) .notes').addClass('hidden');
        $("#counts .count:eq(0)").removeClass('tour-step-backdrop');
      }
    }
  ]
}; // tallyDataTour

var tallyStatsTour = {
  //"debug": true,
  "name": "tallyStatsTour",
  "backdrop": true,
  "template": "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'> <button class='btn btn-default prev' data-role='prev'>« Prev</button> <button class='btn btn-default next' data-role='next'>Next »</button>  </div><button class='btn btn-default' data-role='end'>End tour</button></div>",
  "steps": [
    {
      "title": "Tally Stats Tour",
      "orphan": true,
      "content": "Ready to learn about tally stats?<br /><br />If you get interrupted, you can always continue or restart the tour later by clicking the link in the footer."
    },
    {
      "title": "Tally Stats",
      "element": "#summary .tally-deets.toplevel.row",
      "content": "Here are some high-level stats for this tally, including when you started tracking it and what the status of your goal is (if any).",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; }
    },
    {
      "title": "Count Stats",
      "element": "#summary .tally-deets.counts.row",
      "content": "Here you'll see the fewest, average, and most counts you've tracked per goal period. If you don't have goal for this tally, we'll use 'days' as the time period.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; }
    },
    {
      "title": "Count Chart",
      "element": "#tallyDetailCounts",
      "content": "Here is a bar chart showing aggregated counts for each goal period.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(tour){
        $("#tallyDetailCounts,#tallyDetailCountsChartBottomAxis").addClass('tour-step-backdrop');
      },
      onHide: function(tour){
        $("#tallyDetailCounts,#tallyDetailCountsChartBottomAxis").removeClass('tour-step-backdrop');
      }
    },
    {
      "title": "Numeric Value Stats",
      "element": "#summary .tally-deets.value.row",
      "content": "Here you'll see the lowest, average, and highest numeric value recorded for this tally.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; }
    },
    {
      "title": "Numeric Value Chart",
      "element": "#tallyDetailValue",
      "content": "Here is a line graph showing the change in numeric value over time.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(tour){
        $("#tallyDetailValue,#tallyDetailValueChartBottomAxis").addClass('tour-step-backdrop');
      },
      onHide: function(tour){
        $("#tallyDetailValue,#tallyDetailValueChartBottomAxis").removeClass('tour-step-backdrop');
      }
    },
    {
      "title": "Duration Stats",
      "element": "#summary .tally-deets.duration.row",
      "content": "Here you'll see the shortest, average, and longest durations recorded for this tally.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; }
    },
    {
      "title": "Duration Chart",
      "element": "#tallyDetailDuration",
      "content": "Here is a Gantt chart showing the duration of each count. The duration is indicated by the width of each bar.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; },
      onShow: function(tour){
        $("#tallyDetailDuration,#tallyDetailDurationChartBottomAxis").addClass('tour-step-backdrop');
      },
      onHide: function(tour){
        $("#tallyDetailDuration,#tallyDetailDurationChartBottomAxis").removeClass('tour-step-backdrop');
      }
    },
    {
      "title": "Not-So-Smart Charts?",
      "element": "#summary .btn.btn-block.btn-lg.btn-primary",
      "placement": "top",
      "content": "We've tried to be smart about which charts to show here, but if you disagree with our choices, try out the Correlator, which gives you full control."
    }
  ]
}; // tallyStatsTour

var tallySettingsTour = {
  //"debug": true,
  "name": "tallySettingsTour",
  "backdrop": true,
  "template": "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'> <button class='btn btn-default prev' data-role='prev'>« Prev</button> <button class='btn btn-default next' data-role='next'>Next »</button>  </div><button class='btn btn-default' data-role='end'>End tour</button></div>",
  "steps": [
    {
      "title": "Tally Settings Tour",
      "orphan": true,
      "content": "Ready to learn about tally settings?<br /><br />If you get interrupted, you can always continue or restart the tour later by clicking the link in the footer."
    },
    {
      "title": "Tally Settings",
      "element": "#settings",
      "content": "Here's where you can edit the settings for this tally.<br /><br />A lot of this is pretty obvious, so we'll just hit the interesting bits.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; }
    },
    {
      "title": "Tally Goals",
      "element": "#settings .tally-settings .row:eq(1)",
      "content": "Setting a count goal for this tally will change the color of the tally to reflect whether the goal has been met for the current time period.<br /><br />In the future, you'll be able to set goals for numeric values and durations as well as counts. And you'll get push notifications when you haven't met them!",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; }
    },
    {
      "title": "Add to Another Collection",
      "element": "#settings .tally-settings  .row:eq(5)",
      "content": "A tally can belong to multiple collections, which can be configured here.<br /><br />Imagine you're tracking a vitamin you take every morning; you might want to keep that tally in a collection called Vitamins and also in a collection called Morning that you look at every day when you first wake up.",
      placement: function(){ return ( $('body').width() < 1024 ) ? 'top' : 'left'; }
    },
    {
      "title": "Delete a Tally",
      "element": "#settings .tally-settings [data-target='#confirmDeleteTally']",
      "placement": "top",
      "content": "This is where you'd come to delete a tally."
    }
  ]
}; // tallySettingsTour

var correlatorTour = {
  //"debug": true,
  "name": "correlatorTour",
  "backdrop": true,
  "template": "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'> <button class='btn btn-default prev' data-role='prev'>« Prev</button> <button class='btn btn-default next' data-role='next'>Next »</button>  </div><button class='btn btn-default' data-role='end'>End tour</button></div>",
  "steps": [
    {
      "title": "Welcome to TallyLab's Correlator!",
      "path": "/correlator/",
      "orphan": true,
      "content": "The Correlator is where you'll start to find answers to the questions you've been tracking data for.<br /><br />Remember: Correlation is not causation! But it is a great place start."
    },
    {
      "title": "Pick a Tally",
      "path": "/correlator/",
      "element": "#addChartForm .choose-tally",
      "placement": "bottom",
      "content": "To start, you'll need to pick a tally to chart. Once you have, click 'Next'.",
      onNext: function(tour){
        if ( $("#addChartForm .choose-data").hasClass('hidden') ){
          $("#addChartForm .choose-tally").val($("#addChartForm .choose-tally option:eq(1)").val());
          $("#addChartForm .choose-tally option:eq(1)").prop('selected',true);
          $("#addChartForm .choose-tally").change();
        }
      }
    },
    {
      "title": "Pick a Data Type",
      "path": "/correlator/",
      "element": "#addChartForm .choose-data",
      "placement": "bottom",
      "content": "Next, choose a type of data to chart for this tally. If this tally has counts with numeric values and durations, you'll be able to choose whether to just chart the count itself, or one of the other pieces of data associated with each count.",
      onNext: function(tour){
        if ( $("#addChartForm .choose-chart").hasClass('hidden') ){
          $("#addChartForm .choose-data").val($("#addChartForm .choose-data option:eq(1)").val());
          $("#addChartForm .choose-data option:eq(1)").prop('selected',true);
          $("#addChartForm .choose-data").change();
        }
      }
    },
    {
      "title": "Pick a Chart",
      "path": "/correlator/",
      "element": "#addChartForm .choose-chart",
      "placement": "bottom",
      "content": "Next, choose which type of chart you'd like to display the data in. You'll only see options for types of charts that are supported by the types of data in this tally.",
      onNext: function(tour){
        if ( $("#addChartForm .add-chart").is(':disabled') ){
          $("#addChartForm .choose-chart").val($("#addChartForm .choose-chart option:eq(1)").val());
          $("#addChartForm .choose-chart option:eq(1)").prop('selected',true);
          $("#addChartForm .choose-chart").change();
        }
      }
    },
    {
      "title": "Add Chart",
      "path": "/correlator/",
      "element": "#addChartForm .add-chart",
      "placement": "bottom",
      "content": "Next, click to add the chart.",
      onNext: function(tour){
        if ( $("#TLcorrelator .chart-row").length === 0 ){
          $('#addChartForm .add-chart').click();
        }
      }
    },
    {
      "title": "Behold!",
      "path": "/correlator/",
      "element": "#topAxis",
      "placement": "top",
      "backdrop": false,
      "content": "Your chart gets added to the page, showing all of the data we have for this tally."
    },
    {
      "title": "Time Range Picker",
      "path": "/correlator/",
      "element": "#timeRangeForm",
      "placement": "bottom",
      "content": "You'll notice a time range form appear, showing the date range for the new chart. As you add tallies to the chart, you can change these dates to expand or zoom in on a specific time range."
    },
    {
      "title": "Add a chart",
      "path": "/correlator/",
      "element": "#addChartForm",
      "placement": "bottom",
      "content": "Adding another chart is just like adding the first. Give a go!"
    },
    {
      "title": "Scan for Correlations",
      "path": "/correlator/",
      "element": "#topAxis",
      "placement": "top",
      "backdrop": false,
      "content": "The next chart is added to the page, allowing you to compare the two sets of data over the time range."
    },
    {
      "title": "Correlator Future",
      "path": "/correlator/",
      "orphan": true,
      "content": "That's the basic idea. Keep tracking your data, keep comparing it here. And keep checking back for the many updates we have in store for this tool!"
    }
  ]
}; // correlatorTour

function tourInit(tour,autoStart){

  // Create the tour
  var theTour = new Tour(tour);

  // Initialize the tour
  theTour.init();

  // Show continue once a tour starts
  theTour.onStart = function(){
    $('body > footer .continue-tour').removeClass('hidden');
  };

  // Wire up start link
  $('body > footer .start-tour')
  .removeClass('hidden')
  .off(press)
  .on(press,function(e){
    e.preventDefault();
    localStorage.removeItem(tour.name+'_current_step');
    localStorage.removeItem(tour.name+'_end');
    theTour.start(true).goTo(0);
    return false;
  });

  // Wire up continue link
  $('body > footer .continue-tour')
  .off(press)
  .on(press,function(e){
    e.preventDefault();
    localStorage.removeItem(tour.name+'_end');
    theTour.start(true);
    return false;
  });

  // If this tour hasn't ended yet, and autoStart wasn't specified, launch tour on scroll
  var scrollable = $(document).height() > window.innerHeight;
  if ( !localStorage.getItem(tour.name+'_end') && ( !autoStart || scrollable ) ) {
    $(window).one('scroll.tourLaunch',function(){
      theTour.start();
    });
  }

  // Otherwise, autoStart
  else if ( !localStorage.getItem(tour.name+'_end') ){
    theTour.start();
  }

  if ( localStorage.getItem(tour.name+'_current_step') ){
    $('body > footer .continue-tour').removeClass('hidden');
  }

} // tourInit

// end tour.js
