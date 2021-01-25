/* Global Variables */

  var pageClass = $('body').attr('class');

  var path = location.href.replace('index.html','');

  var local = location.href.indexOf('file:') === -1 ? '' : '/index.html';

  var timers = {};

  var tallyDataSortDir = 'desc'; var tallyDataSortField = 'startDate';

  var periodReference = {
    'minute': { 'number' : 60, 'period' : 'seconds', 'format' : 'YYMMDDHHMM' },
    'hour'  : { 'number' : 60, 'period' : 'minutes', 'format' : 'YYYYMMDDHH' },
    'day'   : { 'number' : 24, 'period' : 'hours',   'format' : 'YYYYMMDD' },
    'week'  : { 'number' : 7,  'period' : 'days',    'format' : 'YYYYww' },
    'month' : { 'number' : 4,  'period' : 'weeks',   'format' : 'YYYYMM' },
    'year'  : { 'number' : 12, 'period' : 'months',  'format' : 'YYYY' },
    'life'  : { 'number' : 99, 'period' : 'years',   'format' : 'YYYY' }
  };

  var colors = [
    /* Names       Teal      Purple    Red       Yellow    Green
    /* Normal  */ '#37718E','#726DA8','#C33C54','#E5B33D','#A5B452',
    /* Lighter */ '#5B8AA2','#8B87B7','#CD5F73','#E9C060','#B5C171',
    /* Darker  */ '#2E5D75','#5E5A8A','#A03245','#BC9332','#889444'
  ];

  numbro.defaultFormat('2a'); // e.g. numbro(1200).format() => "1.2k"

  // Wow iOS treats "scroll" as a resize event = v cool
  var $wynduh = $(window);
  var windowWidth = $wynduh.width();

/* Clicking, touching, squee-eezing: Single codebase for desktop and mobile is not without its frustrations */

  //TODO Remove this whole jalopy situation and just use 'tap' etc. inline
  var press = "tap", // Since we're using the events piece of jQ Mobile, this suffices for touch and mouse devices
      pressLabelLowercase = "click", // As you can see below, I labored over more inclusive language, but there was no way to predefine before that first interaction, which rendered applying the vocabulary useless
      pressLabelCapitalized = "Click", 
      pressLabelExtra = "";

/* Global Events */

  window.tl = new TallyLab({
    version: 4.0
  });

  // this call needs to go last
  window.dbengine = new DatabaseEngine();

  // If new db, create starter identity, redirect to lab
  document.addEventListener('db-created',function(){ 
    firstLoad();
  });

  // If db but no keys, create starter identity, redirect to lab
  document.addEventListener('api-fail',function(){ 
    firstLoad();
  });

  // If there's already a DB, the api should load
  document.addEventListener('api-ready',function(){ 

    // When user enters /app, or if user has somehow ended up on /welcome, but the api is fine, redirect to lab
    if ( $('body').hasClass('app-loader') || location.href.indexOf('welcome') !== -1 ){
      redirectTo('lab');
    } else {
      $('body').removeClass('hidden');
    }

    // Register as an app
    if ('serviceWorker' in navigator) {
      console.log("Will the service worker register?");
      navigator.serviceWorker
        .register('/app/service-worker.js',{
          scope: '/app/'
        })
        .then(function(reg){
          console.log("Yes, it did.");
        })
        .catch(function(err) {
          var msg = location.href.indexOf('file:/') !== -1 ? "Service worker only works in secure mode either in https or localhost. It does not work in local resources like file:// or http." : err;
          console.log("No, it didn't. This happened: ", msg);
        });
    }

    // Parse URL Hash for tally detail actions
    var urlParser = new URLParser(window.location.toString());
    if(urlParser.hasParam("tally") && window.location.hash) {
      var tallyHandle = urlParser.getParam("tally");
      var tallyToModify = tl.getTally({'slug':tallyHandle});
      var hashAction = urlParser.getHash();

      switch(hashAction) {
        case "add":
          tl.createCount({}, tallyToModify);
          break;
        case "sub":
          if ( tallyToModify.counts.length > 0 ){
            var reverseChron = _.orderBy(tallyToModify.counts,['startDate'],['desc']);
            tl.deleteCount(reverseChron[0].startDate,tallyToModify);
          }
          break;
        default:
          break;
      }

      setTimeout(function(){
        history.replaceState('', document.title, location.href.split('#')[0]);
      },tl.syncInterval+500);

    }

    var backupTime = !localStorage.getItem("last_remote_backup") ? 0 : parseInt(localStorage.getItem("last_remote_backup"));
    if ( tl.tallies.length > 0 && ( moment().valueOf() - backupTime ) > tl.backupInterval ) {
      tl.createRemoteBackup();
    } else if ( localStorage.getItem("enable_remote_backup") && localStorage.getItem("enable_remote_backup") !== "return" ) {
      tl.p2p.create_ipns_hash();
    }

    if ( tl.encryption.identity.securityVersion < 1 ){

      // When was the last time we reminded the user to answer the security questions?
      var securityQreminderTime = !localStorage.getItem("securityQreminder") ? 0 : parseInt(localStorage.getItem("securityQreminder"));

      // If they have tallies and we reminded them more than 4.5 days ago
      if ( tl.tallies.length > 0 && ( moment().valueOf() - securityQreminderTime ) > 388800000 ) {

        // Show them the message
        window.location = '/app/settings/finish.html';

      }

    }

    var flogParam = window.location.href.match(/(flog=)(\w*)/);
    var flog = flogParam ? flogParam[2] : localStorage.getItem('flog');
    if ( flog ){
      $.getScript("/app/test/flim-flogs.js")
        .done(function(script, textStatus){ runFlog(flog,'load'); })
        .fail(function(jqxhr, settings, exception){
          console.log(exception);
        });
    } // flogger

  }); // api-ready

  // If there's already a DB and we're on any other page, start building the page
  document.addEventListener('sync',loadHeader);

  // It's 2018 and we're sniffing because iOS + Safari WebView = epic shenanigans ¯\_(ツ)_/¯
  var ua = window.navigator.userAgent;
  var iOS = !!ua.match(/iPhone/i) || !!ua.match(/iPad/i) || !!ua.match(/iPod/i);
  var webkit = !!ua.match(/WebKit/i);
  var iOSSafari = iOS && webkit && !/(Chrome|CriOS|OPiOS|FxiOS|mercury)/.test(ua); // Note: All browsers on iOS say "Safari" in their ua, so we have to instead say, "Is it NOT one of these other browsers?"

  function firstLoad(){
    
    // Does user have an identity in TL yet? 
    var noId = !tl.encryption.identity.private && !tl.encryption.identity.public;

    // Has user already seen this message?
    var msgUnseen = !localStorage.getItem('iOSnotice');

    if ( iOSSafari && noId && msgUnseen ){

      var iosNotice = ''
      + '<div id="iOSnotice">'
      + ' <p>Howdy, iOS-user!</p>'
      + ' <p>If you\'re seeing the Safari icon below in the lower righthand corner of your screen, do yourself a favor and press it.</p>'
      + ' <p class="text-center"><img src="/app/img/ios-safari-sniff-1.png" /><p>'
      + ' <p>That will open TallyLab in a fresh browser instance rather than inside of the app you linked to us from (e.g. Gmail, Twitter, or Facebook).</p>'
      + ' <p>Otherwise, if you see a couple of squares in the lower righthand corner, like this...</p>'
      + ' <p class="text-center"><img src="/app/img/ios-safari-sniff-2.png" /></p>'
      + ' <p>...go ahead and</p>'
      + ' <p class="text-center"><a id="clickThru" class="btn btn-lg btn-primary" href="#">click thru to TallyLab »</a></p>'
      + ' <p>Once you decide you like using TallyLab, we recommend adding it to your homescreen so you don\'t have to worry about this going forward.</p>'
      + ' <p>Thanks for your patience!</p>' 
      + '</div>';
      $('body').append(iosNotice);
      localStorage.setItem('iOSnotice',true);
      $('#clickThru').on(press,function(e){
        e.preventDefault();
        redirectTo('lab');
        return false;
      });

    } // iOS Safari Gmail webview shenanigans

    else {

      // Create new encrypted key
      var identity = tl.encryption.keygen();
      tl.encryption.setIdentity(identity);

      // Redirect to (or reload) the lab
      setTimeout(function(){
        if ( location.href.indexOf('/lab') == -1 ) {
          redirectTo('lab');
        } else {
          window.location.reload(true);
        }
      },tl.syncInterval+1);

    }

  }

/* Global Frame */

  function loadHeader(){

    buildCollectionsNav();
    buildNotificationNav();

    document.removeEventListener('sync',loadHeader);
  }

  function buildCollectionsNav(){

    if ( tl.collections.length > 0 && location.href.indexOf('/app/') !== -1 ) {

      // In order to build, we must first destroy
      $('#collectionsNav .collection-nav-list ul li:not(.all)').remove();

      // Sort
      var sortedCollections = _.orderBy(tl.collections,['title'],['asc']);

      // Assemble
      var linkList = [];
      _.forEach(sortedCollections,function(data,index){
        var slug = data.slug ? data.slug : data.title.replace(/\ /g,'-').toLowerCase();
        linkList.push('<li><a href="/app/lab/index.html?collection='+slug+'">'+data.title+'</a></li>');
      });

      // Append
      $('#collectionsNav .collection-nav-list ul').prepend(linkList);

      // Init
      everyInit('#collectionsNav');

      // Make sure nav scrolls to bottom when bottom dropdown is opened
      $('#adminMenuDropdown:not(.open) .dropdown-toggle').on('tap',function(){
        setTimeout(function(){
          var objDiv = document.getElementById("navbar");
          objDiv.scrollTop = objDiv.scrollHeight;
        },500);
      });
    }

  } // buildCollectionsNav

  function buildNotificationNav(){

    var notificationList = ''
    + '<ul class="dropdown-menu">'
    + ' <li><a target="_blank" href="/list/20200226.html">Timetracking Tools <em>26 Feb</em></a></li>'
    + ' <li><a target="_blank" href="/list/20191215.html">Streaks <em>15 Dec</em></a></li>'
    + ' <li><a target="_blank" href="/list/20190420.html">Behold! Pagination <em>20 Apr</em></a></li>'
    + ' <li><a target="_blank" href="/list/20190118.html">New Year, New Look. <em>18 Jan</em></a></li>'
    + ' <li><a target="_blank" href="/list">View all »</a></li>'
    + '</ul>';
    $('#noteMenuDropdown').append(notificationList);

    var lastSeen = localStorage.getItem('emailNotification');
    var latest = parseInt($('#noteMenuDropdown li:first a').attr('href').split('/list/')[1].split('.')[0]);

    if ( !lastSeen || parseInt(lastSeen) < latest ){
      $('#noteMenuDropdown .dropdown-toggle,#noteMenuDropdown .dropdown-menu li:first-child,.navbar-header button').addClass('new');
    }

    $('#noteMenuDropdown .dropdown-menu a').on('tap.newsList',function(){
      $('#noteMenuDropdown .dropdown-toggle').dropdown();
    });

    $('#noteMenuDropdown').on('hide.bs.dropdown',function(){
      localStorage.setItem('emailNotification',latest);
      $('#noteMenuDropdown .dropdown-toggle,#noteMenuDropdown .dropdown-menu li:first-child,.navbar-header button').removeClass('new');
    });

  } // buildNotificationNav

/* Forms & Validation */

  function formJSON($form){
    var data = {};
    $form.find(':input[name]').not('button').each(function(){
      var $which = $(this);
      if ( $which.closest('.hidden').length === 0 ){
        var key = $which.attr('name');
        var val = $which.is('select') ? $which.find('option:selected').val() : $which.val();
            val = $which.is('[type="checkbox"]') ? $which.is(':checked') : val;
        data[key] = val;
      }
    }); 
    return data;
  }

/* Simple hide/show - because sometimes it's not a tab or some other obvious thing
   - The type of element acting as the trigger matters:
   -- Anchors use the href attribute and are triggered onClick
   -- Selects use the data-reveal of the selected option and are triggered onChange
   -- Radio and checkboxes use data-reveal and are triggered onMouseup
*/

  function simple(type,$which,text){

    // Cast n Crew, defaulted to anchor element
    var target = $which.data('reveal');
    var $scope = $which.closest('.reveal-scope');

    if ( text ){
      $scope.find(target).text(text);
    }

    if ( target === "anchor" ){
      target = $which.attr('href');
    }

    // If only one of the items in the target section should be shown at a given time...
    if ( $which.data('exclusive') === true && type === "reveal" ) { 
      $scope.find('.reveal-target').addClass('hidden'); 
      $scope.find(target).removeClass('hidden');
    }

    // If only one of the items in the target section should be hidden at a given time...
    else if ( $which.data('exclusive') === true && type === "hide" ) { 
      $scope.find('.reveal-target').removeClass('hidden'); 
      $scope.find(target).addClass('hidden');
    }

    // Or just pull the rabbit out of the hat
    else if ( !$which.data('exclusive') && type === "reveal" ){
      $scope.find(target).removeClass('hidden');
    }

    // ...or just put the rabbit back in the hat
    else {
      $scope.find(target).addClass('hidden');
    }

    // Additional option to hide the trigger
    if ( $which.data('hide') === "this" ){
      $which.addClass('hidden');
    }

  }

/* Basic Init */

  function everyInit(parent){

    var $parent = !parent ? $('body') : $(parent);

    /* Internal Links TODO get rid of this? */

      $parent.find('a[data-pageto]')
      .off(press+'.page')
      .on(press+'.page',function(e){
        e.preventDefault();
        pageLink($(this));
        return false;
      });

    /* "Simple" Reveals */

      $parent.find(':checkbox[data-reveal],:radio[data-reveal]').on('change',function(){
        if ( $(this).is(':checked') ){
          simple('reveal',$(this));
        } else {
          simple('hide',$(this));
        }
      });

      $parent.find('a[data-reveal]').on(press,function(e){
        e.preventDefault();
        simple('reveal',$(this));
        return false;
      });

      $parent.find('select[data-reveal]').on('change',function(){
        var $selected = $(this).find(':selected');
        simple('reveal',$selected);
      });

    /* Datetime toggles */

      $parent.find('.tally-deets .datetime')
      .off(press+'.datetime')
      .on(press+'.datetime',function(e){
        e.preventDefault();

        if ( !$(this).data('state') ) {
          $(this).data({
            originalTitle : $(this).attr('title'),
            originalText : $(this).text(),
            state: 'original'
          });          
        }

        var data = $(this).data();

        if ( $(this).data('state') === 'original' ){
          $(this).text(data.originalTitle).attr('title',data.originalText);
          $(this).data('state','toggled');
        } else {
          $(this).text(data.originalText).attr('title',data.originalTitle);
          $(this).data('state','original');
        }

        return false;
      });

    /* Formation */

      // Textarea auto-height, from https://stackoverflow.com/a/25621277/142225
      $('textarea').each(function () {
        if ( this.scrollHeight !== 0 ){
          this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
        }
      }).on('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });

  } // everyInit

  function domValidation($it){

    var valid = validate($it.data('validationType'),$it.val(),$it.data('required'));

    // Error/danger or warning
    if ( valid.status !== "success" ){

      // Branded!
      $it.addClass('has-error');
      
      // Type of error reveal
      if ( $it.data('reveal') ){
        simple('reveal',$it,valid.message);
      } else {
        validationMessaging($it.parent(),valid.status,valid.message);
      }
      
      // Prevent submission
      $it.closest('form').find('[type=submit]').prop('disabled',true);

    } 

    // Success
    else {

      domValidationRemove($it);
    }

    return valid; // Not always necessary, but sometimes valuable

  } // domValidation

  function domValidationRemove($it){
      
      // De-branded!
      $it.removeClass('has-error');

      // Type of error obscure
      if ( $it.data('reveal') ){
        simple('hide',$it);
      } else {
        $it.closest('form').find('.status-messaging').remove();
      }
      
      // Enable submission
      $it.closest('form').find('[type=submit]').attr('disabled',false);

  }

/* Cross-directory functionality */

  function redirectTo(where){
    // var urlArray = location.href.match(/[^\/]+/g); 
    // var lastStop = location.href.indexOf('index.html') !== -1 ? urlArray[urlArray.length-2] : urlArray[urlArray.length-1];
    // window.location.href = ( lastStop === 'app' || lastStop === 'v4' ) ? where+local : '/app/'+where+local;
    window.location.href = '/app/'+where+local;
  }

  function countsByPeriod(counts,period0,value){

    var period = period0 ? period0 : 'day';

    var sortedCounts = _.orderBy(counts,['startDate']);

    // Time encompassed by all counts
    var dateArray = getDateRange(moment(sortedCounts[0].startDate),moment(sortedCounts[sortedCounts.length-1].startDate),periodReference[period].format,period);

    // Add each count to its time period
    _.forEach(sortedCounts,function(v,i){
      var curPer  = moment(v.startDate);
      if ( period === "week" && curPer.week() === 1 && curPer.month() == 11 ){
        curPer = (curPer.year()+1).toString()+'01';
      } else {
        curPer = curPer.format(periodReference[period].format);
      }
      var index = _.findIndex(dateArray,{'startDate':curPer});
      var add = !value ? 1 : parseFloat(v.number);
      if ( index > -1 ){
        dateArray[index].number = dateArray[index].number + add;
      } else {
        dateArray.push({
          'startDate':curPer,
          'number' : add
        });
      }
    });

    return dateArray;

  } // countsByPeriod

  function durationUnits(tally){
    var durationIndex = 0, totalDuration = 0;
    _.forEach(tally.counts,function(data){
      if ( typeof data.endDate !== "undefined" && data.endDate !== null ){
        totalDuration = totalDuration + ( data.endDate - data.startDate );
        durationIndex++;
      }
    });
    var averageDuration = moment.duration(totalDuration/durationIndex).humanize();
    return averageDuration.split(' ')[1];
  }

/* Billing */

  window.enableRemoteBackupHtml = "<p>In order to enable remote backup, you need to be a minimally paying customer. Minimal payment is:</p><ul><li>At least $1 a month<li>At least $10 a year</li><li>A one-time payment of at least $50</li></ul>";

  /*
    The schema goes in order from most inclusive to least inclusive so that the for loop can exit as soon as the user qualifies for the best tier
    Hey, hackers: Be nice. You know this app takes resources to maintain. Don't be a goof!
  */
  var tierSchema = [
    // {
    //   "messaging" : "Your payment qualifies you for <strong>external integrations</strong> and <strong>remote backup</strong> (which will begin automatically when you complete the payment process).",
    //   "minimums" : [
    //     { "billingCycle" : "One-Time Payment",     "billingAmount": 100 },
    //     { "billingCycle" : "Yearly Subscription",  "billingAmount":  25 },
    //     { "billingCycle" : "Monthly Subscription", "billingAmount":   5 }
    //   ]
    // },
    {
      "messaging" : "Your current payment amount qualifies you for <strong>remote backup</strong>, which will begin automatically when you complete the payment process.",
      "minimums" : [
        { "billingCycle" : "One-Time Payment",     "billingAmount": 50 },
        { "billingCycle" : "Yearly Subscription",  "billingAmount": 10 },
        { "billingCycle" : "Monthly Subscription", "billingAmount":  1 }
      ]
    }
  ]; // tierSchema

  function tierMessaging(type,amount){

    var meetsReqs = null;

    tierLoop:

    for ( i = 0; i < tierSchema.length; i++){

      minimumsLoop:

      for ( j = 0; j < tierSchema[i].minimums.length; j++){

        if (
          tierSchema[i].minimums[j].billingCycle.toLowerCase().indexOf(type) !== -1 &&
          parseFloat(tierSchema[i].minimums[j].billingAmount) <= parseFloat(amount)
        ){
          if ( $('#billingForm').length > 0 ){
            validationMessaging($('#billingForm'),"success",tierSchema[i].messaging);
          }
          meetsReqs = true;
          break tierLoop;
        }

        else if (
          type !== "" && amount !== "" &&
          j === tierSchema[i].minimums.length-1 && i === tierSchema.length-1
        ) {
          if ( $('#billingForm').length > 0 ){
            validationMessaging($('#billingForm'),'warning','Your current payment amount helps us keep the lights on, but does not qualify you for any <a href="/app/settings/billing.html#premiumAnchor">premium features</a>.');
          }
          meetsReqs = false;
          break tierLoop;
        }

        else if ( type === "" || amount === "" ) {
          if ( $('#billingForm').length > 0 ){
            $('#billingForm > .status-messaging').remove();
          }
        }

      } // minimumsLoop

    } // tierLoop

    return meetsReqs;

  } // tierMessaging

/* Import/Export */

  function formatCountsForExport(counts){
    var formattedCounts = [];
    _.forEach(counts,function(data,i){
      var nuData = {};
      _.forEach(data,function(value,key){
          if ( value !== null && value !== '' && ( key.indexOf('Date') !== -1 || key.indexOf('Modified') !== -1 ) ){
            nuData[key] = moment(value).format('L LTS');
          } else {
            nuData[key] = value;
          }
      });
      formattedCounts.push(nuData);
    });
    return formattedCounts;
  }

  function exportDbToZip(tl,sync) { // tl = TallyLab object

    var zip = new JSZip();

    // Create an array of collections with select fields (see api.js)
    var collections = _.map(tl.collections,function(collection){
      return _.pick(collection,['_lastModified','_slug','_title']);
    });

    // Create CSV of collection settings
    zip.file('collections.csv',Papa.unparse(collections));

    // Create an array of tallies' settings, to be transformed into a tally settings CSV below
    var tallies = [];
    
    // Cycle through each tally, create CSV, add to ZIP
    _.forEach(tl.tallies,function(tally,tallyIndex){

      // Get select tally settings (see Taly constructor in api.js for full list of attributes)
      var tallySettings = _.pick(tally,['_created','_goalPeriod','goalTotal','_goalType','lastModified','_slug','_tags','_timer','_title','_value']);
      
      // Add collection slugs
      tallySettings._collections = [];
      var collections = _.map(tally.collections,function(value){
        var collection = tl.getCollection({'id' : value});
        if ( collection ){
          tallySettings._collections.push(collection.slug);
        }
      });

      // Add this tally's settings to the tallies array
      tallies.push(tallySettings);
      
      // Add the counts CSV to the ZIP
      var formattedCounts = formatCountsForExport(tally.counts);
      zip.file(tally.slug+'-.-'+tallySettings._collections[0]+'.csv',Papa.unparse(formattedCounts));

    });

    // Create CSV to house tallies' settings and add to ZIP
    zip.file('tallies.csv',Papa.unparse(tallies));

    // Name said ZIP
    var zipname = "tallylab";

    // Generate the ZIP
    var promisedZip = null;
    if (JSZip.support.uint8array) {
      promisedZip = zip.generateAsync({
        type : "uint8array"
      }).then(function(uint8array){
        if ( !sync ){ // This indicates a user is exporting from Settings
          downloadFile(uint8array,zipname,'zip');
        }
        else {
          //TODO remote sync
        }
      });
    } else {
      promisedZip = zip.generateAsync({
        type : "string"
      }).then(function(string){
        if ( !sync ){ // This indicates a user is exporting from Settings
          downloadFile(string,zipname,'zip');
        }
        else {
          //TODO remote sync
        }
      });
    }    

  } // exportDbToZip

  function importTallyCSV(fileObj,tally,overrider){

    var collectionSlug;

    // If fileObj is a jQuery object it's coming from an existing collection and has special requirements
    if ( fileObj instanceof jQuery ){

      // Grab the collection from the name before...
      collectionSlug = fileObj.prop('files')[0].name.split('-.-')[1];
      
      // Redefining it as a non-jQ object
      fileObj = {
        "name" : fileObj.prop('files')[0].name,
        "content" : fileObj.prop('files')[0]
      };
    }

    // If fileObj isn't jQuery, it's coming from a ZIP upload and has other special requirements
    else {

      // If the filename includes a directory ref, we need to remove that (unless it's a __MACOSX file, which we'll ignore later)
      if ( fileObj.name.indexOf('/') !== -1 && fileObj.name.indexOf('MACOSX') == -1 ) {
        fileObj.name = fileObj.name.split('/'); 
        fileObj.name = fileObj.name[fileObj.name.length-1];
      }

      // Grab the collection name
      collectionSlug = fileObj.name.split('-.-')[1]; 

    }

    // We can't create a new tally if...
    if ( fileObj.name.indexOf('MACOSX') !== -1 || // It's an OS ghost file, or
        fileObj.name.indexOf('.csv') == -1     // It's not a CSV
    ){
      $('.modal:visible .status-messaging').append('<br />Failed to import '+fileObj.name);
      return false;
    }

    // Tallies coming from a ZIP import won't come with a tally object defined and therefore have special requirements
    else if ( !tally ){

      var collection = "undefined";

      // Collection-less tallies are exported to CSV with undefined collection, which comes back to us as a string
      if ( collectionSlug !== "undefined.csv" ){

        // Define collection
        collectionObj = {
          "slug" : collectionSlug.replace('.csv',''), 
          "title" : toTitleCase(collectionSlug.replace('.csv','').replace(/-/g,' '))
        };

        // Get or create collection
        collection = !tl.getCollection({'slug':collectionObj.slug}) ? tl.createCollection(collectionObj) : tl.getCollection({'slug':collectionObj.slug});

      }

      // Define tally
      var tallyObj = {
        'slug'  : fileObj.name.split('-.-')[0],
        'title' : toTitleCase(fileObj.name.split('-.-')[0].replace(/-/g,' '))
      };

      // If tally doesn't exist
      if ( !tl.getTally({'slug':tallyObj.slug}) ){

        // If no created date, send message to createTally
        if( !tallyObj.created ){ tallyObj.created = 1; }

        // Create tally
        tally = tl.createTally(tallyObj,collection);

      } // tally didn't exist

      // If tally exists
      else {

        // Get tally
        tally = tl.getTally({'slug':tallyObj.slug});

        // Add current collection to current tally
        if ( collection !== "undefined" && tally.collections.indexOf(collection.id) === -1 ){
          tally.collections.push(collection.id);  
        }

        // Add current tally to current collection
        if ( collection !== "undefined" && collection.tallies.indexOf(tally.id) === -1 ){
          collection.tallies.push(tally.id);
        }

      } // tally exists

    } // tally argument was null (tally is coming from zip)

    // Parse & digest file contents
    Papa.parse(fileObj.content,{
      config: { 
        header: true
      },
      complete: function(results,file){

        // Go through results and add each count to the current tally
        _.forEach(results.data,function(resultData,resultIndex){

          // First row is header
          if ( resultIndex !== 0 ){

            // Create count object
            var count = {};

            // Populate it with result values
            _.forEach(resultData,function(countVal,i){

              if ( countVal == null && results.data[0][i] == "endDate"){
                return;
              } else if ( isNaN(countVal) && results.data[0][i] == "startDate" ){
                return;
              } else {
                countKey = results.data[0][i].replace('_','');
                count[countKey] = countVal;
              }
            });

            // Clean up dates
            count.startDate = moment(count.startDate).isValid() ? moment(count.startDate).valueOf() : formatDeviantDatetime(count.startDate);

            if ( count.endDate && moment(count.endDate).isValid() ){
              count.endDate = moment(count.endDate).valueOf();
            } else if ( count.endDate && !moment(count.endDate).isValid() ){
              count.endDate = formatDeviantDatetime(count.endDate);
            } else {
              count.endDate = null;
            }

            // Dedupe
            var dupe = _.find(tally.counts,{'startDate': count.startDate});
            var dupeIndex = _.findIndex(tally.counts, {'startDate': count.startDate});

            // If there's a dupe...
            if ( dupeIndex !== -1 ){

              if (
                  overrider === 'csv' || // If the user has elected that the CSV override regardless, or
                  ( dupe.lastModified < count.lastModified ) // The local lastModified predates the import's lastModified
                ){
                
                // Remove the local dupe
                tl.deleteCount(dupe.startDate,tally);

                // Add the count from the CSV
                tl.createCount(count,tally); 

              }

              // NOTE: "else" here would be "there's a dupe, but the date is more recent or TL is the overrider" in which case we just leave the local count alone

            }   

            // Otherwise, if there is no dupe
            else {
              // Add the count from the CSV
              tl.createCount(count,tally);
            }

          }
          
        }); // results each
        
        document.dispatchEvent(new CustomEvent(
          "ingestedCSV",{
            "detail" : { 
              "success" : true,
              "file"    : fileObj.name
            }
          })
        );
        // NOTE: If we want to set "worker" to true, we need to pull Papa Parse out of libraries.js into its own file.
      }, // complete
      error: function(error, file, inputElem, reason) {
        document.dispatchEvent(new CustomEvent(
          "ingestedCSV",{
            "detail" : {
              "success" : false,
              "error": error,
              "reason" : reason,
              "file"   : fileObj.name
            }
          })
        );
      } // error
    }); // Papa.parse

  } // importTallyCSV()

  function importSettingsCSV(fileObj,overrider){

    Papa.parse(fileObj.content,{
      config: { 
        header: true
      },
      complete: function(results,file){

        // Go through result rows and update/create each tally/collection
        _.forEach(results.data,function(resultData,resultIndex){

          // First row is header
          if ( resultIndex !== 0 ){

            // Need indexes from header to be able to find values in subsequent rows
            var slugIndex = results.data[0].indexOf('_slug');
            var lmodIndex = results.data[0].indexOf('_lastModified');

            // Gather data
            var settingsObj = {};
            _.forEach(resultData,function(settingVal,i){
              
              // Get header (key) for this value
              var settingKey = results.data[0][i].replace('_','');

              // Collections & Tags need to be transformed back into arrays
              if ( ( settingKey === "collections" || settingKey === "tags" ) && settingVal.length !== 0 ) {
                settingVal = settingVal.split(',');
              } 

              // created, goalTotals need to be numbers
              if ( ( settingKey === "created" || settingKey === "goalTotal" ) && !!settingVal ) {
                settingVal = parseInt(settingVal);
              }

              // Timer needs to be boolean
              if ( settingKey === "timer" && settingVal === "true" ) {
                settingVal = true;
              } else if ( settingKey === "timer" ){
                settingVal = false;
              }
              
              // Add to object
              settingsObj[settingKey] = settingVal;

            });

            // If collection doesn't exist, create it
            if ( fileObj.name === "collections.csv" && !tl.getCollection({'slug':resultData[slugIndex]}) ){
              tl.createCollection(settingsObj);
            } 

            // If tally doesn't exist, create it
            else if ( fileObj.name === "tallies.csv" && !tl.getTally({'slug':resultData[slugIndex] }) ){

              // If no created date, send message to createTally
              if( !settingsObj.created ){ settingsObj.created = 1 }

              // Create tally
              tl.createTally(settingsObj);
            }

            // If the collection exists, compare lastModified
            else if ( fileObj.name === "collections.csv" ) {

              var collection = tl.getCollection({'slug':resultData[slugIndex]});

              // If the current lastModified predates import, import overrides
              if ( collection.lastModified < resultData[lmodIndex] || overrider === 'csv' ){
                tl.updateCollection(settingsObj,collection);
              }

            } // collection exists

            // If the tally exists, compare lastModified
            else {

              var tally = tl.getTally({'slug':resultData[slugIndex]});

              // If the current lastModified predates the import, import overrides
              if ( tally.lastModified < resultData[lmodIndex] || overrider === 'csv' ){

                // Collections array needs to be IDs, not slugs
                var collArray = [];
                _.forEach(settingsObj['collections'],function(slug,i){
                  var collection = tl.getCollection({'slug':slug});
                  collArray.push(collection.id);
                  if ( collection.tallies.indexOf(tally.id) === -1 ){
                    collection.tallies.push(tally.id);
                  }
                })

                // Collections & tags are summed and de-duped
                settingsObj['collections'] = _.uniq(collArray.concat(tally['collections']));
                settingsObj['tags'] = _.uniq(settingsObj['tags'].concat(tally['tags']));

                // Update settings
                tl.updateTally(settingsObj,tally);

              }

            } // tally exists

          } // if not header row
          
        }); // results each
        
      }, // complete
      error: function(error, file, inputElem, reason) {
        console.log(error);
      } // error
    }); // Papa.parse
  
  } // importTallySettings

  function importZip(file,overrider){ // For remote sync this will be importZip(file,'sync')

    JSZip.loadAsync(file).then(

      // Success on zip
      function(zip) {

        if ( overrider !== "sync" ){ // This indicates a user is importing from Settings
          // Report to UI that the zip file went okay
          $('#dbImportForm').append('<div class="alert alert-danger status-messaging">Successfully unzipped '+file.name+'</div>');           
        }

        else {
          //TODO remote sync success log
        }

        /*
           Note that these files need to be processed in order: Collections' Settings, Tallies' Settings, Tally Counts.
           Obvs I'd love if we could just do the forEach one time, look at the name, pick a function, etc. but the
           contents of the zip is in memory and therefore can't really be sorted before the loop. So we gotta look for
           collections, stop, look for tallies, stop, do the counts.
        */

        // Process Collections
        zip.forEach(function(relativePath,zipEntry){

          // Ignore directories
          if ( !zipEntry.dir ) {

            // JSZip
            zipEntry.async('text').then(function(content) {

              if ( zipEntry.name === 'collections.csv' ){
                importSettingsCSV({
                  'name' : zipEntry.name,
                  'content' : content
                },overrider);
              }

            }); // async
          
          } // not a directory
        
        }); // collections

        // Process Tallies
        zip.forEach(function(relativePath,zipEntry){

          // Ignore directories
          if ( !zipEntry.dir ) {

            // JSZip
            zipEntry.async('text').then(function(content) {

              if ( zipEntry.name === 'tallies.csv' ){
                importSettingsCSV({
                  'name' : zipEntry.name,
                  'content' : content
                },overrider);
              }

            }); // async
          
          } // not a directory
        
        }); // tallies

        // Now process each Tally Count CSV
        zip.forEach(function(relativePath,zipEntry){

          // Ignore directories
          if ( !zipEntry.dir ) {

            // JSZip
            zipEntry.async('text').then(function(content) {

              var fileObj = {
                'name' : zipEntry.name,
                'content' : content
              }

              if ( zipEntry.name.indexOf('-.-') !== -1 ){
                importTallyCSV(fileObj,null,overrider);
              }

            }); // async
          
          } // not a directory
        
        }); // counts

        //TODO Easier than fixing everything for now
        cleanDB();

      }, // Success zip

      // Error on zip
      function(e) {
        if ( overrider !== "sync" ){ // This indicates a user is importing from Settings
          // Report error to UI
          $('#dbImportForm').append('<div class="alert alert-danger status-messaging">There was an error unzipping '+file.name+': '+e+'</div>'); 
        }

        else {
          //TODO remote sync error log
        }
        
      }
    ); // JSZip.loadAsync(file)

  } // importZip()

function cleanDB(){

  /* Collection-level repairs */

    _.forEach(tl.collections,function(collection){

      _.forEach(collection.tallies,function(tally){

        // Some tallies were erroneously saved to collection.tallies as something other than a numeric ID
        if ( typeof tally !== "number" ){

          // First make sure this tally exists
          var tallyID = tally   ? tally.slug : null;
              tallyID = tallyID ? tl.getTally({ 'slug' : tallyID }) : null;
              tallyID = tallyID ? tallyID.id : null;

          // If we could get the ID, or if the ID was saved as a string but is parseable as a number
          if ( tallyID || parseInt(tally) !== NaN ){

            // Add id to tallies array
            collection.tallies.push(parseInt(tally))
            console.log("Tally ID converted to numeric value in collection's tally array.");

          }

          // Either way, remove object from tallies array
          _.pull(collection.tallies,tally);
          console.log("Tally object removed from collection's tally array.");

        }

      }); // collection.tallies, first pass

      // Some tallies were added to collection.tallies multiple times
      collection.tallies = _.uniq(collection.tallies);
      console.log("Removed duplicate tally IDs from collection's tally array.");

      // Now that we have a tally array that is 100% unique IDs, run a different set of operations
      _.forEach(collection.tallies,function(tally){

        var tally = tl.getTally({ 'id' : tally });

        // Some tallies were deleted but the id was not removed from collection.tallies
        if ( !tally ){
          collection.tallies.splice(collection.tallies.indexOf(tally),1);
          console.log("Removed undefined tally from collection's tally array.");
        }

        // Some tallies are listed with a collection, but the collection isn't listed in the tally
        else if ( tally['collections'].indexOf(collection.id) === -1 ) {
          tally['collections'].push(collection.id);
          console.log("Listed current collection in tally's collection array.");
        }

      }); // collections.tallies, second pass

    }); // tl.collections

  /* Tally-level repairs */

    _.forEach(tl.tallies,function(tally){

      // Some tallies saved with slug names containing spaces, e.g. 'one-two three four five' should have been 'one-two-three-four-five'
      if ( tally['slug'].indexOf(' ') !== -1 ) {
        tally['slug'] = tally.title.replace(/\ /g,'-').toLowerCase();
        console.log('Converted all spaces in tally slug to dashes.');
      }

      // Some tallies ended up with a collection designated several times
      tally['collections'] = _.uniq(tally['collections']);
      console.log("Removed duplicate collection IDs from tally's collections array.");

      // Somes tallies don't have lastCount, despite having actual counts
      tally['lastCount'] = _.maxBy(tally.counts,'startDate');
      console.log('lastCount added to tally');

      // Some tallies have some wacky collection stuff going on
      _.forEach(tally.collections,function(cId,cIndex){

        var collection;

        // Get the collection, however we have to
        if ( typeof cId !== "number" ){
          collection = tl.getCollection({'slug':cId});
        } else {
          collection = tl.getCollection(cId);
        }

        // Some tallies ended up with a collection listed that no longer exists
        if ( !collection ){
          tally.collections.splice(cIndex);
          console.log('Non-existent collection removed from tally collections list');
        }

        // For collections that do exist, but...
        else {

          // ...weren't saved as an ID, replace slug with ID
          if ( typeof cId !== "number" ) {
            tally.collections.splice(cIndex);
            tally.collections.push(collection.id);
            console.log('Collection slug removed from tally collections list and replaced with ID');
          }

          // ...don't list the tally (i.e. the tally has the collection but not vice versa), add the tally to the collection
          else if ( collection.tallies.indexOf(tally.id) === -1 ){
            collection.tallies.push(tally.id);
            console.log("Added tally id to a collection it had listed but which wasn't listing the tally");
          }

          // ...don't have a lastCount or else it's prior to this tally's lastCount
          if ( tally.lastCount && ( !collection.lastCount || tally.lastCount.startDate > collection.lastCount.startDate ) ) {
            collection.lastCount = tally.lastCount;
          }

        }

      });

    }); // tl.tallies

  document.dispatchEvent( new CustomEvent("cleanedDB") );

} // cleanDB

/* Front-end Testing */

  function dummyID(){ // To be run from welcome flow so you don't have to walk through it when testing

    // Don't run this if you're not on the 'welcome' page
    if ( location.href.indexOf('welcome') !== -1 ){

      // Generate an account
      var username = "Mary Poppins", 
          seed = "supercalifragilisticespiallidocious",
          identity = tl.encryption.keygen(seed.substr(0,32),username);
      tl.encryption.setIdentity(identity,username);

      // Redirect to lab landing
      var local = location.href.indexOf('https') !== -1 ? '' : '/index.html',
          welcomeless = location.href.replace('index.html','').replace('welcome/','');
      window.location.href = welcomeless+'lab'+local;

    } else {
      console.log('Unable to run outside of Welcome workflow');
    }

  } // dummyID

  function dummyDB(){ // Run once to minimally populate a new DB; see maxDB below to loop through

    var now = moment().valueOf();

    // Create new collection

    var collObj = {
      "slug" : 'c'+now,
      "title" : 'c'+now
    }

    var newCollection = tl.createCollection(collObj);

    // Create new tally in each collection

    _.forEach(tl.collections,function(collData,collIndex){

      var tallyObj = {
        "slug" : 't'+now+collIndex,
        "title" : 't'+now+collIndex
      }

      var newTally = tl.createTally(tallyObj,collData);

    });

    // Create new count in each tally

    _.forEach(tl.tallies,function(tallyData,tallyIndex){

      var countObj = {
        "startDate": moment().valueOf(),
        "numebr": moment().valueOf(),
        "note": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. At voluptas doloribus, neque? Itaque eaque dolor rem, necessitatibus, quasi earum accusantium. Vel amet sunt, quisquam. In, ut? Molestiae optio, quae expedita."
      }

      var newCount = tl.createCount(countObj,tallyData);

    });

  } // dummyDB

  var testDBint;

  function maxDB(){
    testDBint = setInterval(function(){

      dummyDB();

      sizeDB();

    },tl.syncInterval+1000);
  } // maxDB

  function deleteDB(){
    testDBint = setInterval(function(){

      if ( tl.collections.length > 0 ) {
        tl.deleteCollection(tl.collections[0]);
      } else {
        clearInterval(testDBint);
      }

      sizeDB();

    },tl.syncInterval+1000);
  } // deleteDB

  function sizeDB(){
    var dbStore = dbengine.db.transaction(['db'], 'readwrite').objectStore('db');

    dbStore.get(1).onsuccess = (event) => {
      var data = event.target.result;
      var counts = 0;
      _.forEach(tl.tallies,function(tallyData,tallyIndex){
        counts = counts + tallyData.counts.length;
      });
      var print = ''
        +JSON.stringify(data).length+ ' characters, '
        +tl.collections.length+' collections, '
        +tl.tallies.length+' tallies, '
        +counts+' counts ';
      console.log(print);
    };
  } // sizeDB

  function stopDB(){
    clearInterval(testDBint);
  } // stopDB
  
// End tallylab.js