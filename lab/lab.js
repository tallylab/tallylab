// First load
function loadLab(){

  buildPage(location.href);
  
  everyInit();

  // Remove first load
  document.removeEventListener('sync',loadLab);
}

document.addEventListener('sync',loadLab);

function buildPage(url){ 

  $('body').attr('class','');
  $('body > .wrapper').addClass('hidden');

  var pageType = 'home';
  
  if ( URLParser(url).hasParam('tally') ) {
    pageType = 'tally';
  } 

  else if ( URLParser(url).hasParam('collection')  ){
    pageType = 'collection';
  }

  switch(pageType){

    /* 
      The pattern for building pages out of data should be: 
        0) Remove     (the old stuff, if any)
        1) Sort       (if applicable)
        2) Assemble   (into an array of jQ objects)
        3) Add to DOM (altogether, only once)
        4) Reveal     (if not covered by #3)
        5) Init       (let's not hold up seeing a UI for setting up invisible interactions)
    */

    case 'home':

        // Add pre-fab collections
        printCollectionSelection();

        // Print user's collections
        if ( tl.collections.length > 0 ){
  
          $('#collections .collection:not(.new,.all-tallies)').remove();

          var userCollectionArray = [];

          // Sort
          var sortedCollections = _.orderBy(tl.collections,['lastCount.lastStartDate'],['desc']);

          // Assemble
          _.forEach(sortedCollections,function(collection,index){
            userCollectionArray.push(printCollectionBox(collection));
          });

          // Add to DOM
          $('#collections .all-tallies').before(userCollectionArray);

          // Format
          $('body').addClass('collection-list');

          // Reveal
          $('#collections,#collectionTemplates').removeClass('hidden');
          $('#pageLoaderContainer').addClass('hidden');

          // All the other init
          everyInit('#collections');

        }

        // Choose Your Adventure
        else {

          // Format
          $('body').addClass('pre-tally');

          // Reveal
          $('#initialAdventure').removeClass('hidden');
          $('#pageLoaderContainer').addClass('hidden');

          // Init
          $('#initialAdventure .new-tallier').on(press,function(e){
            e.preventDefault();
            $('#initialAdventure .choose').addClass('hidden');
            $('html,body').scrollTop(0);
            $('#initialAdventure .brand-new-user,#collectionTemplates').removeClass('hidden');
            if ( !localStorage.getItem("securityQreminder") ) {
              localStorage.setItem("securityQreminder",moment().valueOf());
            }
            return false;
          });

          $('#initialAdventure .returning-tallier').on(press,function(e){
            e.preventDefault();
            localStorage.setItem('enable_remote_backup','return');
            location.href = '/app/settings/security.html';
            return false;
          });

        }

      break; // 'home'

    case 'collection':

      // Which collection?
      var collection = URLParser(url).getParam('collection') === "all-tallies" ? "all-tallies" : tl.getCollection({ 'slug' : URLParser(url).getParam('collection') });

      // If we defs have a real collection
      if ( collection !== undefined && collection !== "all-tallies" ){

        /* Remove */
          
          $('#theCollection ul.nav-tabs li').removeClass('active');
          $('#theCollection .tab-pane').remove();

        /* Assemble, Add, Init for each page */

          // Which tab should be active? 
          var tab = URLParser(url).hasParam('tab') ? URLParser(url).getParam('tab') : 'tallies';

          switch(tab){
            case 'tallies':  

              // Fetch tallies into array
              var tallies = [];
              _.forEach(collection.tallies,function(id){
                tallies.push(tl.getTally({ 'id' : id }));
              });

              // Initial sort
              var sortedTallies = _.orderBy(tallies,['count'],['desc']); //TODO remember from last sort

              // Assemble
              printCollectionTallies(sortedTallies,sortedTallies,collection);

              break;
            case 'charts':   

              printCollectionCharts(collection);

              break;
            case 'settings': 

              printCollectionSettings(collection);

              break;
          }

        /* Reveal */

          $('body').addClass('tally-list');
          $('#theCollection h1 [name="title"]').text(collection.title);
          $('#theCollection .nav-tabs [aria-controls='+tab+']').closest('li').addClass('active');
          $('#theCollection').removeClass('hidden');
          $('#pageLoaderContainer').addClass('hidden');

        /* Tab Links */

          $('.collection-tabs .nav-tabs li a').each(function(){
            var newTab = $(this).attr('aria-controls');
            var newPath = URLParser(location.href).removeParam('tab');
            $(this).attr('href',newPath+'&tab='+newTab);
          });

      }

      // All Tallies collection is no collection at all, really
      else if ( collection === "all-tallies" ){

        /* Remove */
          
          $('#theCollection ul.nav-tabs').remove();
          $('#theCollection .tab-pane').remove();

        /* Assemble, Add, Init for each page */

          // Initial sort
          var sortedTallies = _.orderBy(tl.tallies,['count'],['desc']); //TODO remember from last sort

          // Assemble
          printCollectionTallies(sortedTallies,sortedTallies,"all-tallies");

        /* Reveal */

          $('body').addClass('tally-list');
          $('#theCollection h1 [name="title"]').text("All Tallies");
          $('#theCollection').removeClass('hidden');
          $('#pageLoaderContainer').addClass('hidden');

      }

      // Otherwise something weird happened
      else {

          var newPath = URLParser(location.href).removeParam('collection');
          window.location.href = newPath;

      }

      break; // 'collection'
  
    case 'tally':

      /* Remove */
  
        $('#theTally .tally.box').remove();
        $('#theTally ul.nav-tabs li').removeClass('active');
        $('#theTally .tab-pane').remove();

      /* Assemble */

        // Which collection?
        var collection = tl.getCollection({ 'slug' : URLParser(url).getParam('collection') });

        // Which tally?
        var tally = tl.getTally({ slug : URLParser(url).getParam('tally') });

        // Which tab should be active? 
        var tab = URLParser(url).hasParam('tab') ? URLParser(url).getParam('tab') : 'data';

        // Assuming this tally is for real
        if ( tally !== undefined ){

          /* Every tally detail view shows the tally box at the top */
            
            $('#theTally').prepend(printTallyBox(tally));

            initTallyBoxes('#theTally .tally.box');

          /* Specific view we're after */

            switch(tab){

              case 'data': 

                printTallyData(tally,tallyDataSortDir,'startDate');

                break;
              
              case 'summary': 

                printTallySummary(tally,'all');
                localStorage.setItem('tallyStatsViewPeriod','all');

                $wynduh.on('resize.tally-detail-stats',function(){
                  if ( $wynduh.width() != windowWidth) { // Check window width has actually changed and it's not just iOS triggering a resize event on scroll
                    printTallySummary(tally,localStorage.getItem('tallyStatsViewPeriod'));
                  }
                });

                window.onorientationchange = function(){
                  printTallySummary(tally,localStorage.getItem('tallyStatsViewPeriod'));
                };

                break;
              
              case 'settings': 

                printTallySettings(tally);

                break;
            }

          /* Reveal */

            $('body').addClass('tally-detail');

            $('#theTally').removeClass('hidden');

            $('#pageLoaderContainer').addClass('hidden');

            $('#theTally .nav-tabs [aria-controls='+tab+']').closest('li').addClass('active');

          /* Tab Links */

            $('.tally-tabs .nav-tabs li a').each(function(){
              var newTab = $(this).attr('aria-controls');
              var newPath = URLParser(location.href).removeParam('tab');
              $(this).attr('href',newPath+'&tab='+newTab);
            });

        } 

        // Otherwise, if no tally, something weird is going on 
        else {

          var newPath = URLParser(location.href).removeParam('tally');
              newPath = URLParser(newPath).removeParam('tab');
          window.location.href = newPath;

        }

      break; // 'tally'

  } // pageType switch/case

  $('a[href^="/"][target!="_blank"],a[href^="http"][target!="_blank"]').on('tap.pageUnload',function(e){
    e.preventDefault();

    var url = $(this).attr('href');

    $('body > div').addClass('hidden');
    $('#pageLoaderContainer').removeClass('hidden');

    setTimeout(function(){
      location.href = url;
    },tl.syncInterval+1);
    
  });

  // Scroll to the top agh?
  $('html,body').scrollTop(0);

} // buildPage

function printCollectionSelection(){

  // Remove previous
  $('#collectionSelection [data-slug]').remove();

  var btnHtml = '';

  // Assemble buttons
  _.forEach(collectionWizards,function(collection,key){
    btnHtml = btnHtml+'<a href="#" class="btn btn-xl btn-default" data-slug="'+collection.slug+'"><span class="glyphicons '+collection.icon+'"></span> <span name="title">'+collection.title+'</span></a>';
  }); // forEach collectionWizards

  // Add to DOM
  $('#collectionSelection').prepend(btnHtml);

  // Reveal
  if ( $('#collections').is(':visible') ){
    $('#collectionTemplates,#collectionTemplates [data-colltemp-step="0"]').removeClass('hidden');
    $('#collectionTemplates [data-colltemp-step="1"]').addClass('hidden');
  }

  /* Init buttons */

    $('#addCustomCollection')
    .off('shown.bs.modal')
    .on('shown.bs.modal',function(){

      $('#collectionName').trigger('focus');

      $('#collectionName').on('blur keyup',function(e){
        if ( !e.relatedTarget || e.relatedTarget.className.indexOf('nevermind') === -1 ){
          domValidation($(this));
        }
      });

      $('#addCustomCollection form')
      .off('submit')
      .on('submit',function(e){
        e.preventDefault();

        var $submitBtn = $('#addCustomCollection button[type="submit"]');
        $submitBtn.addClass('loading');

        if ( !$('#collectionName').hasClass('has-error') ){

          var nuColl = $('#collectionName').val();

          var collObj;

          var slug = nuColl.trim().replace(/\ /g,'-').toLowerCase();

          collObj = {
            "slug" : slug,
            "title" : nuColl,
            "tallies" : []
          };

          // Create the collection
          var newCollection = tl.createCollection(collObj);

          setTimeout(function(){
            window.location.href = '/app/lab/index.html?collection='+newCollection.slug;
          },tl.syncInterval+1);

        } // collection name is valid

        return false;
      })
      .off('reset')
      .on('reset',function(e){
        domValidationRemove($('#collectionName'));
        $('#addCustomCollection').modal('hide');
      }); // reset

    }) // modal shown
    .off('hidden.bs.modal')
    .on('hidden.bs.modal',function(){
      $('#collectionName').val('').removeClass('');
      domValidationRemove($('#collectionName'));
    }); // model hidden

    $('#collectionSelection .btn[data-slug]').off(press).on(press,function(e){
      e.preventDefault();

      var collectionSlug = $(this).data('slug');

      // If there's a collection with a similar name
      if ( _.some(tl.collections,function(data,index){ return data.slug.indexOf(collectionSlug) !== -1; }) ){

        $('#collectionDupeWarning').modal('show');

        // If proceed, printTallySelection(collectionSlug)
        $('#collectionDupeWarning .btn-danger').on(press,function(){
          $('#collectionDupeWarning').on('hidden.bs.modal',function(){
            printTallySelection(collectionSlug);
            $('#collectionTemplates [data-colltemp-step="1"] h2').text('Choose Tallies');
          });
        });

      }

      // Otherwise, show tally list
      else {
        printTallySelection(collectionSlug);
      }

      return false;
    });

} // printCollectionSelection

function printTallySelection(collection){

  // Remove previous data
  $("#tallySelection").html('');

  // Retrieve data for this collection
  var collObj = _.clone(_.find(collectionWizards,{'slug':collection}));

  var tallyListHtml = '';

  // Assemble checkboxes
  _.forEach(collObj.tallies,function(tally,key){
    var slug = tally.title.replace(/\ /g,'-').toLowerCase();
    tallyListHtml = tallyListHtml+'<input type="checkbox" id="'+slug+'" name="'+slug+'" value="'+tally.title+'" checked="checked" /> <label class="glyph-checkbox btn btn-lg btn-block btn-default btn-selected" for="'+slug+'"><span class="glyphicons"></span> '+tally.title+'</label>';
  });

  // Add to DOM
  $("#tallySelection").append(tallyListHtml);

  // Reveal
  $('#collectionTemplates [data-colltemp-step="0"]').addClass('hidden');
  $('#collectionTemplates [data-colltemp-step="1"]').removeClass('hidden');
  $('#collectionTemplates [data-colltemp-step="1"] [name="collection-title"]').text(collObj.title);
  if ( $('#initialAdventure').is(':visible') ){
    $('#initialAdventure .brand-new-user').addClass('hidden');
    $('#initialAdventure .collection-template-picker').removeClass('hidden');
  } else {
    $('#collections').addClass('hidden');
  }
  $('html,body').scrollTop($("#collectionTemplates").offset().top-$('nav.navbar').height()-30);

  /* Init */

    // Toggle checkbox
    $('.glyph-checkbox.btn').off(press+'.checkboxBtn').on(press+'.checkboxBtn',function(){
      $(this).toggleClass('btn-selected');
    });

    // Back to Collection Templates
    $('#backToCollectionTemplates').off(press).on(press,function(e){
      e.preventDefault();
      $('#collectionTemplates [data-colltemp-step="0"]').removeClass('hidden');
      $('#collectionTemplates [data-colltemp-step="1"]').addClass('hidden');
      if ( $('#initialAdventure').is(':visible') ){
        $('#initialAdventure .brand-new-user').removeClass('hidden');
        $('#initialAdventure .collection-template-picker [name="collection-title"]').text('');
        $('#initialAdventure .collection-template-picker').addClass('hidden');
      } else {
        $('#collections').removeClass('hidden');
      }
      return false;
    });

    // Toggle all
    $('#toggleCheckboxButtonList').off(press).on(press,function(e){
      e.preventDefault();
      if ( $('#tallySelection input:checked').length > 0 ){
        $('#tallySelection input').removeProp('checked').removeAttr('checked').trigger('blur');
        $('.glyph-checkbox.btn').removeClass('btn-selected').trigger('blur');
      } else {
        $('#tallySelection input').prop('checked','checked').attr('checked','checked').trigger('blur');
        $('.glyph-checkbox.btn').addClass('btn-selected').trigger('blur');
      }
      return false;
    });

    // Install Button
    $('#installSelectedTallies').off(press).on(press,function(e){
      e.preventDefault();

      $('#installSelectedTallies').addClass('loading');

      // If we already have a collection with this name, add -
      var existingColl = tl.getCollection({"slug":collObj.slug});
      collObj.title = existingColl ? collObj.title + '-' : collObj.title;
      collObj.slug = collObj.title.replace(/\ /g,'-').toLowerCase();

      var talliesRef = _.clone(collObj.tallies);

      // Remove tallies in favor of what's selected in DOM
      delete collObj.tallies;

      // Create the collection
      var newCollection = tl.createCollection(collObj);

      // Create each tally
      $('#tallySelection input:checked').each(function(tallyIndex){

        var tallyTitle = $(this).val();

        var tallyObj = _.find(talliesRef,{'title':tallyTitle});

        // If we already have a tally with this name, add -
        var existingTally = tl.getTally({"title": tallyTitle});
        tallyObj.title = existingTally ? tallyTitle + '-' : tallyTitle;
        tallyObj.slug = tallyTitle.replace(/\ /g,'-').toLowerCase();

        // Create tally
        var nuTally = tl.createTally(tallyObj,newCollection);

        // If this is the last tally...
        if ( tallyIndex === $('#tallySelection input:checked').length-1 ){
          // ...redirect user to new collection
          setTimeout(function(){
            window.location.href = '/app/lab/index.html?collection='+newCollection.slug;
          },tl.syncInterval+500);
        }

      });
      return false;
    });

} // printTallySelection

function printCollectionBox(collection){ 

  var slug = collection.slug ? collection.slug : collection.title.replace(/\ /g,'-').toLowerCase();  

  // Template
  var template = $('#collectionTemplate').html().trim();
  var $clone = $(template);
  $clone
    .attr('href','/app/lab/index.html?collection='+slug)
    .addClass(slug)
    .attr('data-collection',slug);
  $clone.find('[name="title"]').text(collection.title);

  // Last Count
  // var lastCount = collection.lastCount;
  // var lastStartDate = moment(lastCount.lastStartDate).format('M/D/YY h:mm a');
  // if ( lastCount.tallyName !== undefined && lastCount.tallyName !== '' ){
  //   $clone.find('.last-count-date').html(''+lastStartDate+'<br />'+lastCount.tallyName);
  // }

  // Get the worst status any of the tallies have
  var talliesArray = [];
  _.forEach(collection.tallies,function(id,index){
    var tally = tl.getTally(id);
    if ( tally !== undefined && tally.goalType !== 'none' ){
      talliesArray.push(calculateTallyStatus(tally));
    }
  });

  var collectionData = talliesArray.length === 0 ? { status: 'info', baddies: 0 } :  calculateCollectionStatus(_.uniqWith(talliesArray,_.isEqual));
  $clone.addClass('btn-'+collectionData.status);

  if ( collectionData.baddies > 0 ){
    $clone.find('.badge').text(collectionData.baddies).removeClass('hidden');
  }

  return $clone;

} // printCollectionBox

function printCollectionTallies(theseTallies,allTallies,collection){

  $('#collTallies').remove();

  var template = $('#collTalliesTemplate').html().trim();
  var $clone = $(template);

  $('#theCollection .tab-content').prepend($clone);

  /* List of Tallies */

    // In order to build, we must first destroy
    $('#tallies .tally.box:not(.new)').remove();

    if ( theseTallies.length > 0 ){

      // Assemble
      var talliesArray = [];
      _.forEach(theseTallies,function(tally,tallyIndex){

        if ( tally !== undefined && tally.slug !== '' ){

          talliesArray.push(printTallyBox(tally));

        }

      });

      // Add to DOM
      $('#tallies .added.grid').prepend(talliesArray);

      // Init
      initTallyBoxes();
    
    }

  /* New Tally Wizard */

    var wOverrides = {

      initialState: $('#newTallyWizard').html().trim(),

      beforeNext: function(wId,$button){

        var $curr = $(wId).find('.step:visible');

        // If there's anything to validate, validate it
        $curr.find('[data-validation-type]').each(function(){
          domValidation($(this));
        });

        // No errors
        if ( $curr.find('.has-error').length === 0 ){

          wizards[wId].next(wId,$button);

        } // validation

      }, // beforeNext

      beforeFinish: function(wId,$button){

        var $curr = $(wId).find('.step:visible');

        // Gata tha data
        var tallyObj = formJSON($(wId).find('form'));
        var tagError = validate('tags',tallyObj.tags);

        if ( tagError.status === "success" ){

          wizards[wId].finish(wId,$button);

        } // Success

        else {
          
          // Show error
          $(wId).find('.tally_tags').addClass('text-danger').text(tagError.message);

        } // Error

      }, // beforeFinish

      finish: function(wId,$button){

        var $curr = $(wId).find('.step:visible');

        var collection = URLParser(location.href).getParam('collection') === "all-tallies" ? "all-tallies" : tl.getCollection({ 'slug': URLParser(location.href).getParam('collection') });

        // Gata tha data
        var tallyObj         = formJSON($(wId).find('form'));
            tallyObj.slug = tallyObj.title.replace(/\ /g,'-').toLowerCase();

        var tagError         = validate('tags',tallyObj.tags);
            tallyObj.tags = tagError.term;

        // Create new tally
        var newTally = tl.createTally(tallyObj,collection);

        // Add new tally to page
        var $nuTally = printTallyBox(newTally);
        $nuTally.insertBefore('#tallies .new.tally.box');
        initTallyBoxes($nuTally);

        // Reset wizard
        wizards[wId].cancel(wId,$button);

      } // Finish

    }; // wOverrides

    wizardize('#newTallyWizard',wOverrides);

  /* Reveal */
            
    $('#tallies > .grid').removeClass('loading').show();

    everyInit('#collTallies');

    if ( theseTallies.length > 0 ){
      tourInit(collectionTour);
    }

  /* Sorting */

    $('#sortTallies a.sort')
    .off(press)
    .on(press,function(e){
      e.preventDefault();

      $(this).closest('.sorts').removeClass('open');

      theseTallies = [];
      _.forEach(tl.getCollection({'slug' : URLParser(location.href).getParam('collection') }).tallies,function(id){ theseTallies.push(tl.getTally({ 'id' : id })); });

      // Sort
      var linkData = $(this).data(), sortedTallies;

      // Recency ascending goes deep
      if ( linkData.sortField === "lastCount" ){

        // Split tallies into tallies with zero counts (splitTallies[0]) and tallies with counts (splitTallies[1])
        var splitTallies = _.partition(theseTallies,function(tally){
           return !tally.lastCount;
        });

        // Sort the tallies with counts
        var sortedSplitTallies1 = _.orderBy(splitTallies[1],function(tally){
           return tally.lastCount.startDate;
        },[linkData.sortDir]);

        sortedTallies = sortedSplitTallies1.concat(splitTallies[0]);
      }

      // Default
      else {
        sortedTallies = _.orderBy(theseTallies,[linkData.sortField],[linkData.sortDir]);
      }

      // Redraw
      printCollectionTallies(sortedTallies,allTallies,collection);

      return false;
    });

  /* Filtering */

    var tagList = [];
    _.forEach(allTallies,function(data,index){

      // Do we have tags?
      if ( data !== undefined && data.tags.length > 0 ){

        // If the tags are a string, push 'em en masse
        if ( typeof data.tags === "string" ){
          tagList.push(data.tags);
        }

        else if ( typeof data.tags === "object" ){
          _.forEach(data.tags,function(tag,i){ //TODO NESTED forEach WTF
            tagList.push(tag);
          });
        }

      } // We have tags

    });

    var uniqueTags = _.uniq(tagList);

    printTags(collection,uniqueTags,$('#filterByTagName'));

    $('#clearFilters .clear')
    .off(press)
    .on(press,function(e){
      e.preventDefault();

      $(this).closest('.filters').removeClass('open').find('.tl-tag').removeClass('active');

      // Get all tallies
      var allTallies = [];
      if ( collection === "all-tallies" ){
        allTallies = tl.tallies;
      } else {
        _.forEach(collection.tallies,function(id){
          allTallies.push(tl.getTally({ 'id' : id }));
        });
      }

      // Redraw
      printCollectionTallies(allTallies,allTallies,collection);

      return false;
    });

} // printCollectionTallies

function printTags(collection,tagArray,$container){

  // Assemble collection's tally objects
  var allTallies = [];
  if ( collection === "all-tallies" ){
    allTallies = tl.tallies;
  } else {
    _.forEach(collection.tallies,function(data,index){
      var tally = tl.getTally({'id':data});
      allTallies.push(tally);
    });
  }

  // Assemble tag UI
  var tagHTML = '';
  _.forEach(tagArray,function(tag,index){
    var tagFilter = '<a class="tl-tag" href="#" data-tag="'+tag+'">'+tag+'</a> ';
    tagHTML = tagHTML+tagFilter;
  });

  // Add
  $container.html(tagHTML);

  // Init
  $container.find('.tl-tag')
  .off(press+'.tl-tag')
  .on(press+'.tl-tag',function(e){
    e.preventDefault();

    if ( !$('body').hasClass('tally-detail') ){

      var tag = $(this).attr('data-tag');

      $('#filterByTagName .tl-tag').removeClass('active');
      $('#filterByTagName .tl-tag[data-tag="'+tag+'"]').addClass('active');

      $('#filterByTagName').closest('.filters').removeClass('open');

      // Sort Tags
      var filteredTallies = [];
      _.forEach(allTallies,function(data,index){
        if ( data && data.tags.indexOf(tag) !== -1 ){
          filteredTallies.push(data);
        }
      });

      // Redraw
      printCollectionTallies(filteredTallies,allTallies,collection);

    }

    return false;
  });

} // printTags

function printCollectionCharts(){

  $('#collCharts').remove();

  var template = $('#collChartsTemplate').html().trim();
  var $clone = $(template);

  $('#theCollection .tab-content').prepend($clone);

  var collCounts;

  $.getScript("/app/correlator/correlator.js", function( data, textStatus, jqxhr ) {
    $('#dateRangeStart').val(moment().subtract(3,'months').format('YYYY-MM-DD'));
    $('#dateRangeEnd').val(moment().format('YYYY-MM-DD'));
    collCounts = loadCollectionCharts();
  });

  $('#collCharts').removeClass('loading').show();

  if ( collCounts > 10 ){
    tourInit(collectionChartsTour);
  }

} // printCollectionCharts

function printCollectionSettings(collection){

  /* Remove */

    $('#collSettings').remove();

  /* Assemble */

    var template = $('#collSettingsTemplate').html().trim();
    var $clone = $(template);

    $clone.find('[name="title"]').val(collection.title);

  /* Add */
    
    $('#theCollection .tab-content').prepend($clone);

  /* Reveal */

    $('#collSettings').removeClass('loading').show();

  /* Init */

    // Save edits
    $('#collSettings .btn-primary')
    .off(press)
    .on(press,function(e){
      e.preventDefault();
      var $button = $(this);
          $button.trigger('blur');
          $button.addClass('loading');

      var newTitle = $('#collSettings [name="title"]').val().trim();
      var newSlug = newTitle.replace(/\ /g,'-').toLowerCase();
      var valid = validate('collection-title',newTitle,true);

      if ( valid.status !== "success" ){
        
        validationMessaging($('#collSettings [name="title"]').parent(),valid.status,valid.message);
        $button.removeClass('loading');

      } else {
        
        var collData = {
          "title" : newTitle,
          "slug" : newSlug
        }
        tl.updateCollection(collData,collection);

        // Wait for DB to sync before rerouting
        setTimeout(function(){
          var newPath = URLParser(location.href).removeParam('collection');
          window.location.href = newPath+'&collection='+newSlug;
        },tl.syncInterval+500);

      }
      return false;
    });

    // Cancel edits
    $('#collSettings .btn-default')
    .off(press)
    .on(press,function(e){
      e.preventDefault();
      window.location.reload(true);
      return false;
    });

    // Cancel delete
    $('#confirmDeleteCollection .btn-default')
    .off(press+'.cancelDelete')
    .on(press+'.cancelDelete',function(e){
      e.preventDefault();
      $('#confirmDeleteCollection').modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
      return false;
    });

    // Download database either in advance of deleting a collection or just cause
    $('#confirmDeleteCollection .download-csv,#downloadCollection')
    .off(press)
    .on(press,function(e){
      e.preventDefault();
      exportDbToZip(tl,false);
      return false;
    });

    // Confirm
    $('#confirmDeleteCollection .btn-danger')
    .off(press+'.delete')
    .on(press+'.delete',function(e){
      e.preventDefault();

      var $button = $(this);
      $button.addClass('loading');

      // Start at the end
      document.addEventListener('cleanedDB',function(e){
        var newPath = URLParser(location.href).removeParam('collection');
            newPath = URLParser(newPath).removeParam('tab');
        window.location.href = newPath;
      });

      var delColTally = $('#confirmDeleteCollection input[name="delColTally"]:checked').val();

      tl.deleteCollection(collection,delColTally);

      return false;
    });

} // printCollectionSettings

function printTallyBox(tally){

  // Cast n Crew
  var collectionSlug = URLParser(location.href).getParam('collection'),
      collection     = collectionSlug === "all-tallies" ? "all-tallies" : tl.getCollection({'slug':collectionSlug}),
      tallySlug      = !tally.slug ? tally.title.replace(/\ /g,'-').toLowerCase() : tally.slug;

  // Clone
  var template = $('#tallyBoxTemplate').html().trim(),
      $tallyBox = $(template);
  $tallyBox.addClass(tallySlug);

  // Cache tally box and other elements of interest
  var $tallyCount = $tallyBox.find('.count'),
      $startTimer = $tallyBox.find('.start-timer'),
      $addCount   = $tallyBox.find('.add-count'),
      $subCount   = $tallyBox.find('.sub-count'),
      $form       = $tallyBox.find('form');

  // Add data
  $tallyBox.find('[name]').each(function(){
    var name = $(this).attr('name');
    $(this).text(tally[name]);
  });

  // Append data to box for referencing later
  _.forEach(tally,function(value,key){
    if ( typeof value !== "array" ){ // We'll deal with tags in a few lines, and collections are only applicable on tally detail
      $tallyBox.data(key.replace('_',''),value);
    }
  });

  // Create links
  var dataLink       = '/app/lab/index.html?tab=data&collection='+collectionSlug+'&tally='+tallySlug;
  var statsLink      = '/app/lab/index.html?tab=summary&collection='+collectionSlug+'&tally='+tallySlug;
  var settingsLink   = '/app/lab/index.html?tab=settings&collection='+collectionSlug+'&tally='+tallySlug;
  
  // Add links
  $tallyBox.find('.view-data').attr('href',dataLink);
  $tallyBox.find('.view-stats').attr('href',statsLink);
  $tallyBox.find('.view-settings').attr('href',settingsLink);

  // Append tags
  printTags(collection,tally.tags,$tallyBox.find('.tally-tags > span'));

  // Hide numeric value form in preparation for possible eventual fade-in
  $form.hide().removeClass('hidden');

  // Count! 
  var count = tally.counts.length > 0 ? tally.counts.length : 0;
  $tallyCount.text(count);

  // If this is a timer with a recent startDate and no endDate, it's active!
  if ( tally.timer === true && count > 0 && !tally.lastCount.endDate ){
    startTimer($tallyBox,tally);
  } 

  // Otherwise if it's a timer without those things, it's merely ready for action
  else if ( tally.timer === true ){
    $startTimer.removeClass('hidden');
    printLastCount($tallyBox,tally);
  }

  // Otherwise, if it's not a timer at all, show the count button
  else {
    $addCount.removeClass('hidden');
    printLastCount($tallyBox,tally);
  }

  // Separately, if there's counts, show the undo count button
  if ( count > 0 ){
    $subCount.css('visibility','visible');
  } else {
    $subCount.css('visibility','hidden');
  }

  // If this tally has a goal, calculate where the count is in relation to that goal
  if ( tally.goalType !== "none" ) {
    var status = calculateTallyStatus(tally);
    $tallyBox.addClass(status.goalStatus+' '+status.goalType);
    $tallyBox.find('.box-content').attr('class','box-content btn-'+status.btnClass);
  } else {
    $tallyBox.find('.box-content').attr('class','box-content btn-info');
  }

  return $tallyBox;

} // printTallyBox

function initTallyBoxes(which){ // One tally box or all of them

  var container = URLParser(location.href).getParam('tally') ? '#theTally' : '#tallies';

  var $targets = !which ? $(container+' .tally.box:not(.new)') : $(which);

  // Add count
  $targets.find('.add-count')
  .off(press+'.tally')
  .on(press+'.tally',function(e){
    e.preventDefault();

    var $tallyBox = $(this).closest('.tally.box'),
        tally = tl.getTally($tallyBox.data('id')),
        now = moment().valueOf();

    // Increment the count
    var counts = tl.createCount({'startDate':now},tally);
    $tallyBox.find('.count').text(counts.length);

    // Show last update
    printLastCount($tallyBox,tally);

    // Show decrement button
    $tallyBox.find('.sub-count').css('visibility','visible');

    // Hide last numeric value (if present)
    $tallyBox.find('.numeric-value').addClass('hidden');

    // Reveal numeric value form
    if ( tally.value.length > 0 ) {
      revealNumeric($tallyBox,tally);
    }

    // Update status
    if ( tally.goalType !== "none" ) { calculateTallyStatus(tally,$tallyBox); }

    // If summary view on tally detail is open, redraw some stuff
    if ( $('#summary').is(':visible') ){
      if ( tally.counts.length > 2 ){
        drawSparklineChart(tally);
      }
      printTallySummary(tally,localStorage.getItem('tallyStatsViewPeriod'));
    }

    // If the data view on tally detail is open, update data
    if ( $('#counts').is(':visible') ){

      tallyDataSortDir = 'desc';
      printTallyData(tally,tallyDataSortDir,'startDate',1);
      
    }

    return false;
  }); // add count

  // Start timer
  $targets.find('.start-timer')
  .off(press+'.tally')
  .on(press+'.tally',function(e){
    e.preventDefault();

    var $tallyBox = $(this).closest('.tally.box'),
        tally = tl.getTally($tallyBox.data('id')),
        now = moment().valueOf();

    // Increment the count
    var counts = tl.createCount({'startDate':now},tally);
    $tallyBox.find('.count').text(counts.length);

    // Show the delete button if not visible
    $tallyBox.find('.sub-count').css('visibility','visible');

    // Start the timer
    startTimer($tallyBox,tally,now);

    // Update status
    if ( tally.goalType !== "none" ) { calculateTallyStatus(tally,$tallyBox); }

    // If summary view on tally detail is open, redraw some stuff
    if ( $('#summary').is(':visible') ){
      if ( tally.counts.length > 2 ){
        drawSparklineChart(tally);
      }
      printTallySummary(tally,localStorage.getItem('tallyStatsViewPeriod'));
    }

    // If the data view on tally detail is open, update data
    if ( $('#counts').is(':visible') ){

      tallyDataSortDir = 'desc';
      printTallyData(tally,tallyDataSortDir,'startDate',1);

    }

    return false;
  }); // start timer

  // Stop timer
  $targets.find('.stop-timer')
  .off(press+'.tally')
  .on(press+'.tally',function(e){
    e.preventDefault();

    var $tallyBox = $(this).closest('.tally.box'),
        tally = tl.getTally(parseInt($tallyBox.data('id')));

    // Update the buttons
    $(this).addClass('hidden');
    $tallyBox.find('.start-timer').removeClass('hidden');

    // Define endDate
    var now = moment().valueOf();
    var newData = { "endDate" : now };

    // Add endDate
    tl.updateCount(newData,tally.lastCount.startDate,tally)

    // Stop the timer
    clearInterval(timers[tally.slug]);
    $tallyBox
      .find('.timer').removeClass('active')
      .find('.glyphicons').addClass('hidden');

    // Show last update
    printLastCount($tallyBox,tally);

    // Reveal numeric value form
    if ( tally.value.length > 0 ) {
      revealNumeric($tallyBox,tally);
    }

    // Update status
    if ( tally.goalType !== "none" ) { calculateTallyStatus(tally,$tallyBox); }

    // If summary view on tally detail is open, redraw some stuff
    if ( $('#summary').is(':visible') ){
      if ( tally.counts.length > 2 ){
        drawSparklineChart(tally);
      }
      printTallySummary(tally,localStorage.getItem('tallyStatsViewPeriod'));
    }

    // If the data view on tally detail is open, update data
    if ( $('#counts').is(':visible') ){

      // If the new count needs to appear at the top of the tally data list...
      if ( tallyDataSortDir === "desc" ){
        
        // Get new HTML
        var $nuCount = printCountData(tally.counts.length,tally.counts[tally.counts.length-1],tally);

        // Replace last count
        $('#counts .count:eq(0)').replaceWith($nuCount);

        // Init
        initCounts($nuCount);

      } 

      // Otherwise we have to reprint the whole list
      //TODO this gets way more complex when users can sort counts by more than just startDate
      else {
        tallyDataSortDir = 'desc';
        printTallyData(tally,tallyDataSortDir,'startDate',1);
      }

    }

    return false;
  }); // stop timer

  // Subtract count
  $targets.find('.sub-count')
  .off(press+'.tally')
  .on(press+'.tally',function(e){
    e.preventDefault();

    var $tallyBox   = $(this).closest('.tally.box'),
        tally       = tl.getTally($tallyBox.data('id')),
        $stopTimer  = $tallyBox.find('.stop-timer');

    // Stop timer if applicable
    if ( $stopTimer.is(':visible') ){
      $stopTimer.addClass('hidden');
      $tallyBox.find('.start-timer').removeClass('hidden');
      $tallyBox
        .find('.timer').removeClass('active')
        .find('.glyphicons').addClass('hidden');
      clearInterval(timers[tally.slug]);
    }

    // Remove last count
    tl.deleteCount(tally.lastCount.startDate,tally);

    // Update count
    $tallyBox.find('.count').text(tally.counts.length);

    // Update sub button
    if ( tally.counts.length > 0 ){
      $(this).css('visibility','visible');
    } else {
      $(this).css('visibility','hidden');
    }

    // Update last update
    printLastCount($tallyBox,tally);

    // Update status
    if ( tally.goalType !== "none" ) { calculateTallyStatus(tally,$tallyBox); }

    // If the data view on tally detail is open, update data
    if ( $('#counts').is(':visible') ){
      tallyDataSortDir = 'desc';
      printTallyData(tally,tallyDataSortDir,'startDate',1);
    }

    return false;
  }); // subtract count

  // Init add numeric value
  $targets.find('form .save')
  .off(press)
  .on(press,function(e){
    e.preventDefault();

    var $tallyBox = $(this).closest('.tally.box'),
        tally     = tl.getTally(parseInt($tallyBox.data('id')));

    saveNumeric($tallyBox,tally);
    
    return false;
  });

  // Cancel numeric value
  $targets.find('form .cancel')
  .off(press)
  .on(press,function(e){
    e.preventDefault();

    var $tallyBox = $(this).closest('.tally.box'),
        tallySlug = $tallyBox.data('slug');

    cancelNumeric($tallyBox,tally);

    return false;
  });

  // Numeric value form is somewhat ephemeral...
  $targets.find('form input')
    .on('blur',function(e){
      e.preventDefault();

      var $tallyBox = $(this).closest('.tally.box'),
          tally = tl.getTally(parseInt($tallyBox.data('id')));
      
      if ( !$(this).val() ){
        cancelNumeric($tallyBox,tally);
      }

      return false;
    })
    .on('keydown',function(e){
      if ( e.keyCode === 13 ){
        e.preventDefault();

        var $tallyBox = $(this).closest('.tally.box'),
            tally     = tl.getTally(parseInt($tallyBox.data('id')));

        saveNumeric($tallyBox,tally);

        return false;
      }
    });
  
} // initTallyBoxes

function printLastCount($tallyBox,tallyData){ 

  // Cache elements
  var $lastUpdate = $tallyBox.find('.last-update'),
      $timer = $tallyBox.find('.timer'),
      $numericValue = $tallyBox.find('.numeric-value');

  // If no lastCount, hide everything
  if ( tallyData.counts.length === 0 ){
    $lastUpdate.addClass('hidden');
    $timer.addClass('hidden');
    $numericValue.addClass('hidden');
  } // no lastCount

  // Otherwise...
  else {

    tallyData.lastCount = new Count(_.maxBy(tallyData.counts,'startDate'));

    // "Ago" style text
    var lastCountAgo = !tallyData.lastCount ? null : moment(tallyData.lastCount.startDate).twitterShort();
        lastCountAgo = lastCountAgo.indexOf('/') !== -1 ? lastCountAgo : lastCountAgo + ' ago';
    
    // Fill in the UI
    $lastUpdate.text(lastCountAgo).attr('title',moment(tallyData.lastCount.startDate).format('M/D/YY h:mm a')).removeClass('hidden');    

    // If there's also an endDate...
    if ( tallyData.lastCount.endDate !== null ){
      // Show duration of last count's timer
      $timer.removeClass('hidden');
      $timer.find('.glyphicons').addClass('hidden');
      calculateDuration($timer.find('.duration'),moment(tallyData.lastCount.startDate).valueOf(),moment(tallyData.lastCount.endDate).valueOf());
    }

    // If there's also a numeric value...
    if ( typeof tallyData.lastCount.number !== "undefined" && tallyData.lastCount.number !== null && tallyData.lastCount.number !== '' ){
      var valueLabel = tallyData.value.length > 0 ? ' '+tallyData.value : '';
      $numericValue.text(tallyData.lastCount.number+valueLabel).removeClass('hidden');
    }

  } // lastCount exists

} // printLastCount

function startTimer($tallyBox,tallyData){

  var $tallyDuration = $tallyBox.find('.timer .duration');
      $tallyDuration.text('');
  $tallyBox.find('.timer').addClass('active').removeClass('hidden');

  timers[tallyData.slug] = setInterval(function(){
    var diff = moment().valueOf() - tallyData.lastCount.startDate;
    var time = moment.duration(diff,'milliseconds').format("d[d] hh:mm:ss",{forceLength: true}).toString();
        time = time.indexOf(':') !== -1 ? time : '00:'+time;
    $tallyBox.find('.timer .duration').text(time);
  },1000);

  // Show timer stuff, hide last-count stuff
  $tallyBox.find('.stop-timer,.glyphicons-stopwatch').removeClass('hidden');
  $tallyBox.find('.start-timer,.last-update,.numeric-value').addClass('hidden');

} // startTimer

function revealNumeric($tallyBox,tally){

  // Clear previous
  $tallyBox.find('form.tally-number input[type="number"]').val('');

  if ( tally.value ) {
    $tallyBox.find('.tally-number [name="label"]').text(tally.value);
  }

  setTimeout(function(){

    // Fade out normal stuff, fade in form
    $tallyBox.find('.tally-deets').fadeOut(function(){
      
      var $tallyForm = $tallyBox.find('form').fadeIn(function(){

        $tallyForm.find('input').focus();

      });

    });
  },500);

} // revealNumeric

function saveNumeric($tallyBox,tally){

  // Define number
  var number = $tallyBox.find('form input').val() === '' ? null : parseFloat($tallyBox.find('form input').val());
  var newData = { "number" : number };

  // Save number 
  tl.updateCount(newData,tally.lastCount.startDate,tally);

  // Add to display
  printLastCount($tallyBox,tally);

  // Hide zero out, etc.
  cancelNumeric($tallyBox,tally);

  // If the data view on tally detail is open...
  if ( $('#counts').is(':visible') ){
    
    // Get new HTML
    var $nuCount = printCountData(tally.counts.length,tally.counts[tally.counts.length-1],tally);

    // Replace last count
    $('#counts .count:eq(0)').replaceWith($nuCount);

    // Init count
    initCounts($nuCount);

  }

} // saveNumeric

function cancelNumeric($tallyBox,tally){

  // Fade out form
  var $tallyForm = $tallyBox.find('form');

  $tallyForm.fadeOut(function(){
    
    // Fade in normal stuff
    $tallyBox.find('.tally-deets').fadeIn();
    
    // Update numeric value
    var lastNum = !tally.lastCount || typeof tally.lastCount.number === "undefined" || tally.lastCount.number === null ? '' : tally.lastCount.number;
    $tallyForm.find('input').val(lastNum);

  });

} // cancelNumeric

function calculateTallyStatus(tally,$tallyBox){

  var goal = parseFloat(tally.goalTotal);

  // Define our window of time
  var windowStart = moment().subtract(periodReference[tally.goalPeriod].number,periodReference[tally.goalPeriod].period);

  // Define our list of counts
  var counts = _.orderBy(tally.counts, ['startDate'], ['desc']);

  // Find counts after windowStart
  var windowCounts = [];
  _.forEach(counts,function(data,index){
    var countStart = moment(data.startDate);
    if ( countStart > windowStart ){
      windowCounts.push(data);
    } else {
      return false;
    }
  });

  // Is the length of these counts over, under, or at the goalTotal?
  var goalStatus = "met";
  if ( windowCounts.length > goal ){
    goalStatus = "over";
  } else if ( windowCounts.length < goal ){
    goalStatus = "under";
  }

  var nuClass = calculateTallyClass(tally.goalType,goalStatus);

  // Add classes to tally box
  if ( $tallyBox ){
    $tallyBox
      .removeClass('met under over none at-least at-most exact')
      .addClass(goalStatus+' '+tally.goalType)
      .find('.count').attr('title','Goal status: '+goalStatus).end()
      .find('.box-content').attr('class','box-content btn-'+nuClass);
  }

  var tallyStatus = {
    "btnClass"   : nuClass,
    "goalStatus" : goalStatus,
    "goalType"   : tally.goalType,
    "curTotal"   : windowCounts.length
  };

  var durSumObj = getTotalDuration(windowCounts);
  if ( durSumObj.durSum && durSumObj.durSum > 0 ){
    tallyStatus.curDurSum = durSumObj.durSum;
    tallyStatus.curDurUnit = durSumObj.durUnit;
  }

  var curNumSum = _.sumBy(windowCounts,function(o) { if ( o.number ) return parseFloat(o.number); });
  if ( curNumSum && curNumSum > 0 ){
    tallyStatus.curNumSum = curNumSum;
  }

  return tallyStatus;

} // calculateTallyStatus

function calculateTallyClass(goalType,goalStatus){

  var tallyClass = goalType === 'none' ? 'info' : 'success';

  if (
    ( goalType === "at-least" && goalStatus === "over" ) ||
    ( goalType === "at-most" && goalStatus === "under" )
  ){
    tallyClass = 'success';
  }

  else if (
    ( goalType === "at-least" && goalStatus === "under" ) ||
    ( goalType === "at-most" && goalStatus === "over" ) ||
    ( goalType === "exact" && goalStatus === "over" ) ||
    ( goalType === "exact" && goalStatus === "under" )
  ){
    tallyClass = 'danger';
  }

  else if ( goalStatus === "met" ){
    tallyClass = 'primary';
  }

  else {
    tallyClass = 'info';
  }

  return tallyClass;

}

function calculateCollectionStatus(talliesArray){

  var collectionStatus = 'info';

  var badTallies = 0;

  _.forEach(talliesArray,function(data,index){
    
    /* First, translate the tally's status into something the collection can use */

      var tallyStatus = calculateTallyClass(data.goalType,data.goalStatus);

      if ( tallyStatus === "danger" ){
        badTallies++;
      }

    /* Then, update the collection's status based on bad > good > okay > none */

      // Gotta start somewhere
      if ( collectionStatus === 'info' ){
        collectionStatus = tallyStatus;
      } 

      // Then this gets complicated...
      else {

        // A bad tally spoils the collection no matter what
        if ( tallyStatus === 'danger' ){
          collectionStatus = 'danger';
        } 

        // If a collection is already bad, it can't become better
        // And an "okay" tally overrides a good collection
        else if ( collectionStatus !== 'danger' && tallyStatus === "primary" ){
          collectionStatus = 'primary';
        }

        // If a collection is already bad, it can't become better
        // If a collection is already okay, it can't become better
        // Bar for "good" is very high, people
        else if ( collectionStatus !== 'danger' && collectionStatus !== 'primary' && tallyStatus === "success" ){
          collectionStatus = 'success';
        }

      }

  });

  return {
    status: collectionStatus,
    baddies: badTallies
  };

} // calculateCollectionStatus

function printTallySummary(tally,viewPeriod){

  var chartWrap = d3.select("#summary");
  chartWrap.selectAll('svg').remove();

  $('#summary').remove();

  var template = $('#tallySummaryTemplate').html().trim();
  var $clone = $(template);

  var tallyStats = tally.counts.length > 0 ? calculateTallyStats(tally,viewPeriod) : [];

  if ( tally.counts.length > 5 ){

    /* Stats */

      $clone.find('.stat[name="valueName"]').text(tally.value);

      _.forEach(tallyStats,function(v,k){
        if ( k !== "numSum" || ( k === "numSum" && !Number.isNaN(v) ) ){
          var $stat;
          if ( k.indexOf('Title') !== -1 ){
            $stat = $clone.find('.stat[name='+k.slice(0,-5)+']');
            $stat.attr('title',v).data('toggle','tooltip').tooltip();
          } else {
            $stat = $clone.find('.stat[name='+k+']');
            $stat.html(v);
          }
          if ( k !== "goalPeriod" ){
            $stat.closest('.row').removeClass('hidden');
            $stat.closest('.well').removeClass('hidden');
            $stat.closest('.alert').removeClass('hidden');
            $stat.closest('.highlight').removeClass('hidden');
            $stat.closest('.stats-row-stat').removeClass('hidden');
          }
        }
      });

      $('#theTally .tab-content').prepend($clone);

    /* View Period Picker */

      // Update currently selected
      var viewPeriodShown = typeof viewPeriod === "object"? "Custom" : $('#viewPeriodPicker a[data-time-range="'+viewPeriod+'"]').text();
      $('#viewPeriodShown').text(viewPeriodShown);

      $('#viewPeriodPicker a')

        // Which time periods are valid?
        .each(function(){
          var timeRange  = $(this).data('timeRange');
          var rangeStart = timeRange.indexOf('this-') !== -1 ? moment().startOf(timeRange.split('-')[1]).valueOf() : moment().subtract(1,timeRange).valueOf();

          // If the latest count isn't in this time range, nix it
          if ( timeRange !== "all" && timeRange !== "custom" && tally.lastCount.startDate < rangeStart ){
            $(this).closest('li').remove();
          }
        })

        // Init
        .on('tap.timeFilter',function(e){
          e.preventDefault();
          var viewPeriodPicked = $(this).data('timeRange');
          if ( viewPeriodPicked !== "custom" ){
            printTallySummary(tally,viewPeriodPicked);
            localStorage.setItem('tallyStatsViewPeriod',viewPeriodPicked);
          } else {

            // Reveal Modal
            $('#customStatsRange').modal('show');

            // On custom apply...
            $('#filterTallyStatsCustom').on('tap',function(e){

              // Remove previous errors
              $('#customStatsRange .modal-body .alert').remove();

              // Gather dates
              var filterTallyStatsStart = $('#customStatsRangeStart').val().trim();
              var filterTallyStatsEnd = $('#customStatsRangeEnd').val().trim();
                  // If user doesn't specify a time, let's make sure we include the entire day...
                  filterTallyStatsEnd = filterTallyStatsEnd.indexOf(':') === -1 ? filterTallyStatsEnd+" 11:59:59 pm" : filterTallyStatsEnd;
              viewPeriodPicked = [moment(filterTallyStatsStart),moment(filterTallyStatsEnd)];

              // Make sure there are counts
              var filteredCounts = _.filter(tally.counts,function(c){
                return c.startDate >= viewPeriodPicked[0].valueOf() && c.startDate <= viewPeriodPicked[1].valueOf();
              });

              // If there are counts, reprint page
              if ( filteredCounts.length > 0 ){
                $('#customStatsRange').modal('hide');
                printTallySummary(tally,viewPeriodPicked);
                localStorage.setItem('tallyStatsViewPeriod',viewPeriodPicked);
              }

              // If there aren't counts, print error
              else {
                $('#customStatsRange .modal-body').prepend('<p class="alert alert-danger">There are no counts in that range.</p>');
              }

            });
          }
          return false;
        });

    /* Charts */

      // Update viewPeriod to not have pesky "this-"
      if ( typeof viewPeriod === "object" ){
        viewPeriod = getCustomTimePeriod(viewPeriod);
      } else {
        viewPeriod = viewPeriod.indexOf('this-') !== -1 ? viewPeriod.split('-')[1] : viewPeriod;
      }

      setTimeout(function(){ // not sure why, but without this the chart widths don't work
        var countsChartOptions = {
          period: viewPeriod !== "all" ? periodReference[viewPeriod].period.slice(0,-1) : tally.goalPeriod,
          yUnits: 'counts',
          xAxis: 'Date',
          yAxis: 'Counts',
          color: '#e5b33d' // mustard
        };
        drawChart('vertical-bar','tallyDetailCountsChart',tallyStats.countChartData,countsChartOptions);

        if ( tallyStats.valuesChartData ) {
          var valuesChartOptions = {
            yUnits: tally.value,
            xAxis: 'Date',
            yAxis: tally.value,
            color: '#e58500' // orange
          };
          drawChart('line','tallyDetailValueChart',tallyStats.valuesChartData,valuesChartOptions);
        } else {
          $('#tallyDetailValue,#tallyDetailValueChartBottomAxis').addClass('hidden');
        }

        if ( tallyStats.durationChartData ) {
          var durationChartOptions = {
            yUnits: tallyStats.yUnits,
            xAxis: 'Duration',
            color: '#8c564b' // brown
          };
          drawChart('line','tallyDetailDurationChart',tallyStats.durationChartData,durationChartOptions);
        } else {
          $('#tallyDetailDuration,#tallyDetailDurationChartBottomAxis').addClass('hidden');
        }

        if ( tallyStats.notesData ){
          $('#wordCloud').jQCloud(tallyStats.notesData,{
            width: $('#summary').width(),
            height: 350,
            colors: colors
          });
          $('#tallyDetailWordCloud').removeClass('hidden');
        }

        $('#summary').removeClass('loading').show();

      },500);

    tourInit(tallyStatsTour);
  } else {
    $('#theTally').append('<br><br><p class="alert alert-danger">You don\'t have enough data yet for stats. Get tallying!</p>');
  }

} // printTallySummary

function numberToDisplay(inputNum){
  var outputNum = inputNum, numString = inputNum.toString(), numNum = parseFloat(inputNum);
  if ( numString.length < 5 && numString.indexOf('.') !== -1 ){
    outputNum = numNum.toFixed(2);
  } else if ( numString.length > 4 ){
    outputNum = numbro(numNum).format();
  }
  return outputNum;
}

function calculateTallyStats(tally,viewPeriod){

  var tallyStats = {
    "tallyName"         : tally.title,
    "tallyCount"        : numberToDisplay(tally.counts.length),
    "goalPeriod"        : tally.goalPeriod,
    "avgCountPerPeriod" : null
  };

  var sortedCounts = _.orderBy(tally.counts,['startDate']);

  tallyStats.firstTallyDate = moment(sortedCounts[0].startDate).format('l');

  /* Update counts array if we're showing charts for a subset of counts */

    if ( typeof viewPeriod === "object" ){
      sortedCounts = _.filter(sortedCounts,function(o){
        return o.startDate > viewPeriod[0].valueOf() && o.startDate < viewPeriod[1].valueOf();
      });
    } else if ( viewPeriod !== "all" && viewPeriod.indexOf('this-') == -1 ){
      sortedCounts = _.filter(sortedCounts,function(o){
        return o.startDate > moment().subtract(1,viewPeriod).valueOf();
      });
    } else if ( viewPeriod !== "all" && viewPeriod.indexOf('this-') !== -1 ){
      viewPeriod = viewPeriod.split('-')[1];
      sortedCounts = _.filter(sortedCounts,function(o){
        return o.startDate > moment().startOf(viewPeriod).valueOf();
      });
    }

  /* Top-Level Stats */

    tallyStats.curCount = sortedCounts.length;

    // If a streak makes sense for this tally, find the longest, shortest, and current streaks
    if ( tally.goalType === "at-least" || tally.goalType === "exact" ){
      
      var streakPeriod = tally.goalTotal > 1 ? periodReference[tally.goalPeriod].period : tally.goalPeriod+'s',
          streaks = [],
          thisStreak = {
            num: 1,
            date: moment(sortedCounts[0].startDate).startOf(streakPeriod.slice(0,-1))
          }

      _.forEach(sortedCounts,function(data,i){

        var thisStart = moment(data.startDate).startOf(streakPeriod.slice(0,-1));
        
        if ( thisStart.diff(thisStreak.date,streakPeriod) === 1 ){

          // Increment the current streak
          thisStreak.num++;
          thisStreak.date = thisStart;

          // If this also happens to be the last count
          if ( i === tallyStats.curCount-1 ){

            // Shelve it
            streaks.push(_.cloneDeep(thisStreak));

          }

        } 

        else {

          // Shelve the last streak
          streaks.push(_.cloneDeep(thisStreak));

          // Start a new streak
          thisStreak.num = 1;
          thisStreak.date = thisStart;

        }

      });

      var curStreak   = _.orderBy(streaks, ['date'], ['desc'])[0],
          longStreak  = _.orderBy(streaks, ['num','date'], ['desc','desc'])[0],
          shortStreak = _.orderBy(streaks, ['num','date'], ['asc','desc'])[0];

      tallyStats.streakPeriod = streakPeriod;
      tallyStats.longStreakNum = longStreak.num;
      tallyStats.longStreakDate = longStreak.date.format('l');
      tallyStats.curStreakNum = curStreak.num;
      tallyStats.curStreakDate = curStreak.date.format('l');
      tallyStats.shortStreakNum = shortStreak.num;
      tallyStats.shortStreakDate = shortStreak.date.format('l');

    } // Streaks

    var numSum = _.sumBy(sortedCounts, function(o) { if ( o.number ) return parseFloat(o.number); });
    if ( numSum && numSum > 0 ){
      tallyStats.numSum = numberToDisplay(numSum);
    }

    var durSumObj = getTotalDuration(sortedCounts);
    if ( durSumObj.durSum && durSumObj.durSum > 0 ){
      tallyStats.durSum = numberToDisplay(durSumObj.durSum);
      tallyStats.durUnit = durSumObj.durUnit;
      tallyStats.durSumTitle = durSumObj.durSum;
    }

  /* Counts */

    var period;

    if ( typeof viewPeriod === "object" ){
      period = getCustomTimePeriod(viewPeriod);
    } else if ( viewPeriod === "all" ){
      period = tally.goalPeriod;
    } else {
      period = periodReference[viewPeriod].period.slice(0,-1);
    }

    tallyStats.goalPeriod = period; 

    var periodArray = countsByPeriod(sortedCounts,period);
    tallyStats.totalPeriods = periodArray.length;

    // Average
    var avgCountPerPeriod = sortedCounts.length/tallyStats.totalPeriods;
    tallyStats.avgCountPerPeriod = numbro(Math.round(avgCountPerPeriod*100)/100).format();
    
    // Least/Most
    var periodValues = _.map(periodArray,'number');
    periodValues.sort(function(a, b) { return a - b; });
    tallyStats.fewestCounts = numbro(periodValues[0]).format();
    tallyStats.mostCounts = numbro(periodValues[periodValues.length-1]).format();

    // Chart
    var countChartData = [{
        x: moment(sortedCounts[0].startDate).toDate(),
        y: 0
    }];
    _.forEach(periodArray,function(data,i){
      countChartData.push({
        x: moment(data.startDate,periodReference[period].format).toDate(),
        y: parseFloat(data.number)
      });
    });

    tallyStats.countChartData = countChartData;

  /* Numeric Values */

    var totalValues = 0, valuesArray = [], valuesChartData = [];
    _.forEach(sortedCounts,function(data,i){ 
      if ( data.number && data.number.toString().length > 0 ) {
        var dataNumber = parseFloat(data.number);
        totalValues = totalValues+dataNumber;
        valuesArray.push(dataNumber);
        valuesChartData.push({
          x: moment(data.startDate).toDate(),
          y: dataNumber
        });
      }
    });

    if ( valuesArray.length > 2 ){ // We just need enough to make an average from

      tallyStats.tallyValue = tally.value;

      tallyStats.averageValue = Math.round((totalValues/valuesArray.length)*100)/100;

      valuesArray.sort(function(a, b) { return a - b; });
        tallyStats.lowestValue = valuesArray[0];
        tallyStats.highestValue = valuesArray[valuesArray.length-1];

      tallyStats.valuesChartData = valuesChartData;

    }

  /* Durations */

    var totalDuration = 0, durationArray = [], durationChartData = [];
    tallyStats.yUnits = durationUnits(tally) === "few" ? tallyStats.durUnit : durationUnits(tally);

    if ( tallyStats.yUnits ){
      _.forEach(sortedCounts,function(data,i){

        var diff = getCountDuration(data);

        if ( diff ) {

          var duration = moment.duration(diff).as('seconds');
          totalDuration = totalDuration + parseFloat(duration);
          durationArray.push(duration);

          durationChartData.push({
            x: moment(data.startDate).toDate(),
            y: moment.duration(diff).as(tallyStats.yUnits)
          });

        }

      });

      if ( durationArray.length > 2 ) { // We just need enough to make an average from

        tallyStats.averageDuration = moment.duration(totalDuration/durationArray.length,'seconds').format("d[d] h[h] m[m] s[s]", { largest: 2 });

        durationArray.sort(function(a, b) { return a - b; });
        tallyStats.shortestDuration = moment.duration(durationArray[0],'seconds').format("d[d] h[h] m[m] s[s]", { largest: 2 });
        tallyStats.longestDuration = moment.duration(durationArray[durationArray.length-1],'seconds').format("d[d] h[h] m[m] s[s]", { largest: 2 });

        tallyStats.durationChartData = durationChartData;

      } else {

        delete tallyStats.durSum;
        delete tallyStats.durUnit;

      }
    }

  /* Notes */

    if ( !_.every(sortedCounts, ['note', '']) ){

      // Make one giant word blob out of all notes, minus punctuation
      var notesArray  = _.map(sortedCounts,'note');
      var notesString = notesArray.join(' ').replace(/[\.\,\/\#\!\$\%\^\&\*\;\:\{\}\=\_\`\'\~\(\)]/g,"");
      var wordsArray  = removeStopWords(notesString);

      var wordsObj = {};
      for (var i = 0; i < wordsArray.length; i++) {
        var num = wordsArray[i];
        wordsObj[num] = wordsObj[num] ? wordsObj[num] + 1 : 1;
      }

      var words = [];
      _.forEach(wordsObj,function(value,key){
        if ( key.length > 1 ){
          words.push({text:key,weight:value});
        }
      });

      words = _.orderBy(words, ['weight'], ['desc']);
      words.splice(75);

      tallyStats.notesData = words;

    }

  return tallyStats;

} // calculateTallyStats

function getCustomTimePeriod(viewPeriod){
  var humanTime = moment.duration(viewPeriod[1].diff(viewPeriod[0])).humanize().split(' ')[1]
  period = humanTime[humanTime.length-1] === 's' ? humanTime.slice(0,-1) : humanTime;
  return periodReference[period].period.slice(0,-1);
}

function getCountDuration(data){
  var diff = null;
  if ( data.endDate ) {
    diff = data.endDate - data.startDate;
  }
  return diff;
}

function getTotalDuration(counts){
  var durUnit = null, durSum = _.sumBy(counts,function(o) { var diff = getCountDuration(o); if ( diff ) return diff; });
  if ( durSum && durSum > 0 ){
    durSumFormatted = moment.duration(durSum,'milliseconds').format("h[-hours] m[-minutes] s[-seconds]", { largest: 1 });
    durUnit = durSumFormatted.split('-')[1];
    durSum = moment.duration(durSum,'milliseconds').as(durUnit).toFixed(2);
  }
  return {
    durSum: durSum,
    durUnit: durUnit
  }
}

function printTallyData(tally,sortDir,sortField,curPage){

  /* Remove */
  
    $('#data').remove();

  /* Get */

    curPage = !curPage ? 1 : curPage;

    var countPP = 25;

    var printIndex = sortDir === 'desc' ? tally.counts.length-(countPP*(curPage-1)) : (countPP*(curPage-1))+1;
    var counts     = _.orderBy(tally.counts,[sortField],[sortDir]);
    var pageList   = tl.getCounts(counts,curPage,countPP,sortDir);

  /* Assemble */

    // List counts
    var countList = [];
    _.forEach(pageList,function(data,countIndex){

      var $nuCount = printCountData(printIndex,data,tally);

      countList.push($nuCount);
      
      printIndex = sortDir === 'desc' ? printIndex-1 : printIndex+1;

    });

  /* Add */

    var template = $('#tallyDataTemplate').html().trim();
    var $clone = $(template);
   
    $('#theTally .tab-content').append($clone);

    $('#counts').append(countList);

    if ( tally.counts.length < 26 ){

      $('#data nav.pages').hide();

    } else {

      $('#curPage').val(curPage);

      $('#totalPages').text(Math.ceil(tally.counts.length/countPP));

    }

  /* Reveal */

    if ( tally.counts.length > 2 ){
      drawSparklineChart(tally);

      $wynduh.on('resize.sparkline',function(){
        drawSparklineChart(tally);
      });

      window.onorientationchange = function(){
        drawSparklineChart(tally);
      }
    }

    $('#data').removeClass('loading').show();

  /* Init */

    initTallyData(tally);

    if ( tally.counts.length > 0 ){
      tourInit(tallyDataTour);
    }

} // printTallyData

function initTallyData(tally){
  // Share Tally
  $("#data #shareTally")
  .off(press)
  .on(press, function(e) {
    e.preventDefault();
    tally.shareTally();
    return false;
  })
  
  // Sorting
  $('#data .sorts .sort')
  .off(press+'.sort')
  .on(press+'.sort',function(e){
    e.preventDefault();
    tallyDataSortDir = $(this).attr('data-sort-dir');
    tallyDataSortField = $(this).attr('data-sort-field');
    printTallyData(tally,tallyDataSortDir,tallyDataSortField);
    return false;
  });

  // Export CSV
  $('#exportTally')
  .off(press)
  .on(press,function(e){
    e.preventDefault();
    var formattedCounts = formatCountsForExport(tally.counts);
    var csv = Papa.unparse(formattedCounts);
    downloadFile(csv,tally.slug,'csv');
    return false;
  });

  // Import CSV
  $('#confirmImportTally .import-csv')
  .off(press)
  .on(press,function(e){
    e.preventDefault();

    var $button = $(this).addClass('loading');    

    // Validate (gotta do this separately from validate.js cause of reasons)
    if ( $('#confirmImportTally input[type=file]').val() === "" ){
      validationMessaging($('#csvImportForm'),'danger','Gotta have a file, yo');
    } 

    // So we have an actual file...
    else {

      $('#csvImportForm .status-messaging').remove();

      var overrider = $('#confirmImportTally [name="overrider"]:checked').val();

      var $fileobj = $('#confirmImportTally input[type=file]');

      document.addEventListener('ingestedCSV',function(e){

        $button.removeClass('loading');

        if ( !e.detail.success ){

          var message = !e.detail ? '.' : ': '+e.detail.error+' because '+e.detail.reason;
          $('#confirmImportTally input[type=file]').before('<div class="alert alert-danger status-messaging">There was an error importing your CSV'+message+'</div>');

        } else {

          $('#confirm').modal('hide');
          $('body').removeClass('modal-open');
          $('.modal-backdrop').remove();

          // Update tally box
          $('#theTally .tally.box').remove();
          $('#theTally').prepend(printTallyBox(tally));
          initTallyBoxes('#theTally .tally.box');

          // Print the data
          printTallyData(tally);

        }

      }, false);

      importTallyCSV($fileobj,tally,overrider);
    
    }

    return false;
  });

  // Cancel import CSV
  $('#confirmImportTally .btn-default')
  .off(press)
  .on(press,function(e){
    e.preventDefault();
    $('#confirmImportTally').modal('hide');
    // $('body').removeClass('modal-open');
    // $('.modal-backdrop').remove();
    return false;
  });

  //Pagination
  $('#prevPage').on('tap',function(e){
    e.preventDefault();
    var curPage = parseInt($('#curPage').val());
    if ( curPage !== 1 ){
      printTallyData(tally,tallyDataSortDir,tallyDataSortField,curPage-1);
      $('html,body').scrollTop($('#tallyDetailSparkline').offset().top);
    }
    return false;
  });
  $('#nextPage').on('tap',function(e){
    e.preventDefault();
    var curPage = parseInt($('#curPage').val());
    var totPage = parseInt($('#totalPages').text());
    if ( curPage !== totPage ){
      printTallyData(tally,tallyDataSortDir,tallyDataSortField,curPage+1);
      $('html,body').scrollTop($('#tallyDetailSparkline').offset().top);
    }
    return false;
  });
  $('#curPage').on('keypress',function(e){
    if (e.which == 13) {
      e.preventDefault();
      var curPage = parseInt($('#curPage').val());
      printTallyData(tally,tallyDataSortDir,tallyDataSortField,curPage);
      $('html,body').scrollTop($('#tallyDetailSparkline').offset().top);
    }
  });

  /* Each Count */

    initCounts();  

  everyInit('#data');

} // initTallyData

function drawSparklineChart(tally){

  if ( tally.counts.length > 1 ){

    // Delete previous
    $('#tallyDetailSparkline').empty();

    // Sort counts
    var sortedCounts = _.orderBy(tally.counts,['startDate']);

    /* Establish time range */
      var dateRangeStart, dateRangeEnd;
      
      // If there's no goal, do the entire range of dates
      if ( !tally.goalTotal ){
        dateRangeStart = moment(sortedCounts[0].startDate);
        dateRangeEnd   = moment(sortedCounts[sortedCounts.length-1].startDate);      
      }

      // Otherwise, show the last few goal periods
      else {
        dateRangeStart = moment(sortedCounts[sortedCounts.length-1].startDate).subtract(5,tally.goalPeriod);
        dateRangeEnd   = moment(sortedCounts[sortedCounts.length-1].startDate);
      }

    // Narrow the counts down to only counts in our range
    sortedCounts = _.filter(sortedCounts,function(o){ return moment(o.startDate) > dateRangeStart; });

    var chartData = smartChart(tally,sortedCounts);

    // Format data
    var formattedCounts = [];
    _.forEach(chartData.sortedCounts,function(data,index){ 
      var num, date;
      if ( chartData.dataType === "durations" ){
        var dur = data.endDate - data.startDate;
        num = moment.duration(dur).as(chartData.yUnits);
        date = new Date(data.startDate);
      } else if ( chartData.dataType === "numbers" ) {
        num = parseFloat(data.number);
        date = new Date(data.startDate);
      } else {
        num = parseFloat(data.number);
        date = moment(data.startDate,periodReference[tally.goalPeriod].format).toDate();
      }
      formattedCounts.push({
        x: date,
        y: num
      });
    });

    drawChart('line','tallyDetailSparkline',formattedCounts,{yUnits:chartData.yUnits});

  } // if counts

} // drawSparklineChart 

function smartChart(tally,sortedCounts){

  // Counts with numeric values
  var countsWithNums = _.filter(sortedCounts,function(o){
    return ( typeof o.number !== "undefined" && o.number !== null && o.number !== "" );
  });

  // Counts with durations
  var countsWithEnds = _.filter(sortedCounts,function(o){
    return ( typeof o.endDate !== "undefined" && o.endDate !== null && o.endDate !== "" );
  });

  /* Best guess at which chart will be most salient based on the data */

    var dataType, yUnits;

    // Favor numeric values when more than half of counts have them
    if ( countsWithNums.length > sortedCounts.length/2 ){
      dataType = "numbers";
      yUnits = tally.value;
      sortedCounts = countsWithNums;
    }

    // Similar rubric for durations, but only if numeric values didn't make the cut
    else if ( countsWithEnds.length > sortedCounts.length/2 ){
      dataType = "durations";
      yUnits = durationUnits(tally);
      sortedCounts = countsWithEnds;
    }

    // Default to counts by period
    else {
      dataType = "counts-per";
      yUnits = "counts per "+tally.goalPeriod;
      sortedCounts = countsByPeriod(sortedCounts,tally.goalPeriod);
    }

  return {
    dataType: dataType,
    yUnits: yUnits,
    sortedCounts: sortedCounts
  }

} // smartChart

function initCounts(which){ // don't specify which if you want to init all counts
  
  var tally = tl.getTally({'slug':URLParser(location.href).getParam('tally')});
  var $targets = !which ? $('#counts .count') : $(which);

  // Edits
  $targets.find(':input')
    .off('keydown.count-edits')
    .on('keydown.count-edits',function(e){ 
        if ( e.which === 13 ){
          $(this).trigger('blur');
        }
      })
    .off('input.count-edits')
    .on('input.count-edits',function(e){
        var $count = $(this).closest('.count');
        var val = $(this).val();
        if ( val != $(this).attr('data-original') ){
          $count.find('.active-edits').removeClass('hidden');
        }
      });

  // Edit/add numeric value
  $targets.find('[name="number"]')
  .off('input.number-edit blur.number-edit')
  .on('input.number-edit blur.number-edit',function(e){
    var numLength = $(this).val().toString().length;
    $(this).css({
      'width': numLength*12+'px',
      'minWidth' : '48px'
    });
  });

  // Save button
  $targets.find('.active-edits .save')
  .off(press)
  .on(press,function(e){
    e.preventDefault();
    $(this).addClass('loading');
    var $count = $(this).closest('.count');
    saveCountEdits(tally,$count);
    return false;
  });

  // Cancel button
  $targets.find('.active-edits .cancel')
  .off(press)
  .on(press,function(e){
    e.preventDefault();
    var $count = $(this).closest('.count');
    cancelCountEdits(tally,$count);
    return false;
  });

  // Jump to field
  $targets.find('.dropdown-menu li a')
  .off(press+'.count')
  .on(press+'.count',function(e){
    e.preventDefault();

    var name = $(this).attr('href');
    var $count = $(this).closest('.count');
    var $field = $count.find('[name="'+name+'"]');

    // First show parent
    $field.closest('p').removeClass('hidden');

    // Then show field
    $field.removeClass('hidden').trigger('focus');

    // If we're adding a new endDate, pre-fill with startDate
    if ( name === "endDate" && $count.find('[name="endDate"]').val() === '' ) {
      var startDate = $count.find('[name="startDate"]').val();
      $count.find('[name="endDate"]').val(startDate);
    }

    // Close drop-down
    $count.find('.dropdown').removeClass('open');
    $count.find('.dropdown-toggle').attr('aria-expanded',false);

    return false;
  });

  // Delete count
  $targets.find('.delete-count')
  .off(press+'.count')
  .on(press+'.count',function(e){
    e.preventDefault();

    $(this).addClass('loading');
    
    // Which count?
    var $count = $(this).closest('.count');
    var startDate = parseInt($count.find('[name="startDate"]').attr('data-original'));

    // Delete it
    tl.deleteCount(startDate,tally);

    // Update tally box after the DB syncs
    setTimeout(function(){

      // Update tally box
      $('#theTally .tally.box').remove();
      $('#theTally').prepend(printTallyBox(tally));
      initTallyBoxes('#theTally .tally.box');

      // Update data
      printTallyData(tally,tallyDataSortDir,'startDate');

      // Stop loading
      $(this).removeClass('loading');

    },tl.syncInterval+500);

    return false;
  });

} // initCounts

function printCountData(printIndex,data,tally){

  // Templatize
  var countTemplate = $('#dataCountTemplate').html().trim();
  var $count = $(countTemplate);

  // Index is special
  $count.find('.index').text(printIndex);

  // Label if we have one
  $count.find('[name="value"]').text(tally['value']);

  // We have to do this based on the DOM instead of the data since we can't get data that are functions
  $count.find('[name]').each(function(){

    // Which?
    var $el = $(this);
    var name = $el.attr('name');

    // If we have data for that element, and it isn't "value" or "duration"
    if ( data[name] !== null && data[name] !== '' && name !== 'value' && name !== 'duration'){

      // Fill it in
      $el.val(data[name]).attr('data-original',data[name]);

      // Format date/times
      if ( name.indexOf('Date') !== -1 ) {
        var text  = moment(data[name]).format("M/DD/YY h:mm:ss a");
        var title = moment(data[name]).format("dddd, MMMM Do YYYY, h:mm:ss a");           
        $el.val(text).attr('title',title).attr('data-original',data[name]);       
      }
      
      // Duration
      if ( name === 'endDate' ){ 
        // Calculate duration
        calculateDuration($count.find('[name="duration"]'),data['startDate'],data['endDate']);
        $count.find('.durations').removeClass('hidden');
      }

      // Add label
      if ( name === 'number' ){ 

        // How big to make field? 
        var numLength = data[name] ? data[name].toString().length : 1;        
        $count.find('[name="number"]').css({
          'width': numLength*12+'px',
          'minWidth' : '48px'
        });

        // If there is a numeric value, but there's no label, suggest they add one to the tally settings
        if ( data[name] && data[name].length > 0 && !tally['value'] ){
          var newURL = location.href.replace('tab=data','tab=settings');
          var message = 'You can specify a label for your numeric values, e.g. "miles", in <a href="'+newURL+'">this tally\'s Settings</a>';
          $count.find('[name="value"]').append('<span class="glyphicons glyphicons-question-sign" data-toggle="popover" data-placement="top"></span>');
          $count.find('[name="value"] [data-toggle="popover"]').popover({
            "content" : message,
            "html"    : true,
            "trigger" : "click hover focus"
          });
        }
      }

      // Update geo link
      // For future reference, path between points format something like http://maps.google.com/?saddr=Current%20Location&daddr=Destination%20Address
      if ( name === "geoPosition" ){
        $el.closest('.place').find('a').attr('href',$el.closest('.place').find('a').attr('href')+data[name]);
        $el.closest('.place').removeClass('hidden');
      }

      // Replace "add" with "edit" in dropdown
      $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Edit')

      // Reveal
      $el.closest('p').removeClass('hidden');
    
    } // data[name] !== null

  });

  // Huzzah
  return $count;

} // printCountData

function saveCountEdits(tally,$count){

  // Which count? startDate may be changing, so we need to keep the previous value to use as reference
  var countKey = parseInt($count.find('[name="startDate"]').attr('data-original'));

  var newData = {
    'error' : false
  };

  $count.find(':input').each(function(){

    var $el = $(this), 
        name = $(this).attr('name'), 
        val = $el.val().trim();

    switch(name){

      case 'startDate':

        var oldStartDate = moment($el.attr('data-original'));
        var newStartDate = moment(val,'M/DD/YY h:mm:ss a');

        // startDate can't be empty
        if ( val === '' ){

          // Instantiate error message
          validationMessaging($count.find('.data-row'),'danger','A count must have a start date/time. To delete this count, choose "Delete Count" from the index dropdown.');

          // Update data
          newData['error'] = true;

          // Re-place with original date
          $el.val(oldStartDate.format("M/DD/YY h:mm:ss a"));

          return false;
        }

        // If the user didn't actually change the value, but instead is just losing fractional seconds
        // because aren't shown in the field, keep the value as-is
        else if ( Math.abs(oldStartDate-newStartDate) < 1000 && oldStartDate.seconds() === newStartDate.seconds() ){
          newData['startDate'] = oldStartDate.valueOf();
        }

        // startDate must be a valid moment
        else if ( !newStartDate.isValid() ){

          // Instantiate error message
          validationMessaging($count.find('.data-row'),'danger','Please enter a valid date, e.g. 1/1/11 11:11:30 am');

          // Update data
          newData['error'] = true;

          // Re-place with original date
          $el.val(oldStartDate.format("M/DD/YY h:mm:ss a"));

          return false;
        }
        
        // If endDate exists, startDate must PRECEDE it
        else if ( $count.find('[name="endDate"]').val() && newStartDate.valueOf() > moment($count.find('[name="endDate"]').val()).valueOf() ){

          // Instantiate error message
          validationMessaging($count.find('.data-row'),'danger','Please enter a date/time that precedes this count\'s current end date/time.');

          // Update data
          newData['error'] = true;

          // Re-place with original date
          $el.val(oldStartDate.format("M/DD/YY h:mm:ss a"));

          return false;
        }

        // Otherwise this is a valid startDate that really did change, so...
        else {

          // Save date to DB
          newData['startDate'] = newStartDate.valueOf();
          
          // ...followed by a zillion UI updates
          var text = ' ', title = '', unix = '';

          // Establish new time in various fun formats
          text  = newStartDate.format("M/DD/YY h:mm:ss a");
          title = newStartDate.format("dddd, MMMM Do YYYY, h:mm:ss a");
          unix  = newStartDate.valueOf();

          // Add to UI
          $el.val(text).attr('title',title).attr('data-original',unix);

          // If there is an endDate, we also have a duration to figure out
          if ( $count.find('[name="endDate"]').val() ){
            calculateDuration($count.find('[name="duration"]'),unix,$count.find('[name="endDate"]').attr('data-original'));
          } else {
            $count.find('.durations').addClass('hidden');
            $count.find('[name="duration"]').text('').attr('title','').addClass('hidden');
          }

        } // valid startDate

        break; // startDate case

      case 'endDate':

        var oldEndDate = moment($el.attr('data-original'));
        var newEndDate = moment(val,'M/DD/YY h:mm:ss a');

        // endDate can be empty, but if so it should be saved as null, not moment('')
        if ( $el.val() === "" ){

          // Give null value to data object
          newData['endDate'] = null;

          // Empty out UI
          $el.val(text).attr('title','').attr('data-original','');

          // Hide endDate
          $count.find('.timestamps.end').addClass('hidden');
          
          // Show "add" button in dropdown
          $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Add');

          // Empty out duration
          $count.find('.durations').addClass('hidden');
          $count.find('[name="duration"]').text('').attr('title','').addClass('hidden');

        } // empty endDate

        // If the user didn't actually change the value, but instead is just losing fractional seconds
        // because aren't shown in the field, keep the value as-is
        else if ( Math.abs(oldEndDate-newEndDate) < 1000 && oldEndDate.seconds() === newEndDate.seconds() ){
          newData['endDate'] = oldEndDate.valueOf();
        }

        // If not empty, endDate must be a valid moment
        else if ( $el.val() && !newEndDate.isValid() ) {

          // Instantiate error message
          validationMessaging($count.find('.data-row'),'danger','Please enter a valid date, e.g. 1/1/11 11:11:30 am');

          // Update data
          newData['error'] = true;

          // Re-place with original date
          $el.val(oldEndDate.format("M/DD/YY h:mm:ss a"));

          return false;
        }

        // If not empty, endDate must be after startDate
        else if ( $el.val() && newEndDate.valueOf() < moment($count.find('[name="startDate"]').val()).valueOf() ){

          // Instantiate error message
          validationMessaging($count.find('.data-row'),'danger','Please enter a date/time that is after this count\'s start date/time.');

          // Update data
          newData['error'] = true;

          // Re-place with original date
          $el.val(oldEndDate.format("M/DD/YY h:mm:ss a"));

          return false;
        }

        // Otherwise we have a new, valid endDate to save
        else {

          // Save date to DB
          newData['endDate'] = newEndDate.valueOf();
          
          // ...followed by a zillion UI updates
          var text = ' ', title = '', unix = '';

          // Establish new time in various fun formats
          text  = newEndDate.format("M/DD/YY h:mm:ss a");
          title = newEndDate.format("dddd, MMMM Do YYYY, h:mm:ss a");
          unix  = newEndDate.valueOf();

          // Show "edit" button in dropdown
          $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Edit');

          // Add to UI
          $el.val(text).attr('title',title).attr('data-original',unix);

          // Since this is an endDate, we also have a duration to figure out
          calculateDuration($count.find('[name="duration"]'),$count.find('[name="startDate"]').attr('data-original'),unix);

        } // valid endDate
          
        break; // endDate

      case 'number':

        // Empty is okay
        if ( val === '' ){

          // Save date to DB
          newData['number'] = null;

          // Show "add" button in dropdown
          $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Add');

          // Update data-original
          $el.attr('data-original','');

        }

        // Has to be a number
        else {

          val = parseFloat(val);

          if ( val === NaN ) {

            // Instantiate error message
            validationMessaging($count.find('.data-row'),'danger','Numeric value field can only contain numbers.');

            // Update data
            newData['error'] = true;

            return false;
          } 

          else {

            // Save date to DB
            newData['number'] = val;

            // Show "edit" button in dropdown
            $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Edit');

            // Update data-original
            $el.attr('data-original',val);
          }

        } // Not empty

        break; // number

      case 'geoPosition':

        // Empty is okay
        if ( val === '' ){

          // Save to DB
          newData['geoPosition'] = null;

          // Show "add" button in dropdown
          $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Add');
          
          // Hide .place
          $el.closest('.place').addClass('hidden');

        }

        else {

          // Save to DB
          newData['geoPosition'] = val;

          // Show "edit" button in dropdown
          $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Edit');

          // Show .place
          $el.closest('.place').removeClass('hidden');

        }

        // Either way, update the link
        var original = $el.closest('.place').find('a').attr('href').split('=');
        $el.closest('.place').find('a').attr('href',original[0]+'='+val);

        // Update data-original
        $el.attr('data-original',val);

        break; // geoPosition

      case 'note':

        //TODO validate against code injection at the very least? I guess it's just injecting code into your own local DB, which would be dumb to do...

        // Save note to DB
        newData['note'] = val;

        // Empty is okay
        if ( $el.text().trim() === '' ){
          // Show "add" button in dropdown
          $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Add');
        } else {
          // Show "edit" button in dropdown
          $count.find('.dropdown-menu a[href="'+name+'"] .add-edit').text('Edit');
        }

        // Update data-original
        $el.attr('data-original',$el.text().trim());

    } // switch

  }); // each input

  if ( !newData.error ){

    // Remove errors
    $count.find('.status-messaging.alert-danger, .status-messaging.alert-warning').remove();

    // Actually save
    tl.updateCount(newData,countKey,tally);

    // Blur form fields
    $count.find(':input').trigger('blur');

    // UI updates after the DB syncs
    setTimeout(function(){

      // Update tally box
      $('#theTally .tally.box').remove();
      $('#theTally').prepend(printTallyBox(tally));
      initTallyBoxes('#theTally .tally.box');

      // Stop loading
      $count.find('.save').removeClass('loading');

      // Hide save/cancel
      $count.find('.active-edits').addClass('hidden');

      // Re-init
      initCounts($count);

    },tl.syncInterval+500);

  } else {

    // Stop loading
    $count.find('.save').removeClass('loading');

  }

} // saveCountEdits

function cancelCountEdits(tally,$count){

  // Reference date in case one of the changes was to startDate
  var oldStartDate = parseInt($count.find('[name="startDate"]').attr('data-original'));

  // Get the original pre-change data
  var countData = _.find(tally.counts,{'startDate': oldStartDate});

  // Various indices
  var printIndex = $count.find('.index').text();

  // HTML
  var $nuCount = printCountData(printIndex,countData,tally);

  // Replace changed HTML with original-data-infused HTML
  $('#counts .count').has('[data-original="'+oldStartDate+'"]').replaceWith($nuCount);

  // Re-init
  initCounts($nuCount);

} // cancelCountEdits

function printTallySettings(tally){

  $('#settings').remove();

  var template = $('#tallySettingsTemplate').html().trim();
  var $clone = $(template);

  $clone.find('[name]').each(function(){
    
    var $input = $(this),
        element = $input.attr('type') ? $input.attr('type') : $input.prop('nodeName'),
        key = $input.attr('name'),
        valueType = typeof tally[key],
        value = ''
      ;

    switch(valueType){
      case "string":
      case "number":
      case "boolean": 
        value = tally[key];
        break;
      case "array":
      case "object":
        _.forEach(tally[key],function(v){
          value = value === '' ? v : value+', '+v;
        });
        break;
    }

    switch(element){
      case "number":
      case "text":
      case "SELECT":
        $input.val(value);
        break;
      case "TEXTAREA":
        $input.text(value);
        break;
      case "checkbox":
      case "radio":
        $input.attr('checked',value);
    }

    // Special cases
    switch(key){

      // Collections are a list of IDs, so we have to look up their names
      case "collections":
        var collectionList = '';
        _.forEach(tally[key],function(v,k){  
          var collection = tl.getCollection(parseInt(v));
          if ( collection ){
            collectionList = (collectionList === '') ? collection.title : collectionList+', '+collection.title;
          }
        });
        $input.val(collectionList); // Overwrite what we did above
        break;
      
      // Goal type comes with other fields, so those need to be shown
      case "goalType": 
        if ( tally[key] !== 'none' ){
          $input.closest('.reveal-scope').find('.reveal-target').toggleClass('hidden');
        }
        break;
      
      // Numeric value comes with other fields, so those need to be shown
      case "value":
        if ( tally[key] !== "" ){
          $input.closest('.row').find('[type="checkbox"]').attr('checked',true);
          $input.closest('.row').find('.reveal-target').toggleClass('hidden');
        }
        break;
        
    }
      
  });

  $clone.find('#confirmDeleteTally').attr('data-id',tally.id);

  $('#theTally .tab-content').prepend($clone);

  /* Init buttons */

    // Blur validation
    $('#settings [data-validation-type]')
    .off('blur.validate')
    .on('blur.validate',function(){
      domValidation($(this));
    });

    // Checkbox hide/show value shenanigans
    $('#value').on('change',function(e){
      if ( $(this).prop('checked') === false ){
        $('#tallyValueLabel').val('');
        setTimeout(function(){
          $('#tallyValueLabel').closest('.reveal-scope').find('.reveal-target').toggleClass('hidden');
        },5);
      } else {
        setTimeout(function(){
          $('#tallyValueLabel').trigger('focus');
        },5);
      }
    });

    $('#settings form.tally-settings')
    .off('submit.update')
    .on('submit.update',function(e){
      e.preventDefault();
      //TODO Make this actually save, dummy
      return false;
    });

    // Save
    $('#settings .btn-primary')
    .off(press+'.update')
    .on(press+'.update',function(e){
      e.preventDefault();

      var $button = $(this);
      $button.addClass('loading');

      var $form = $('#settings form');

      $form.find('[data-validation-type]').each(function(){
        var valid = domValidation($(this));
        if ( valid.status !== "success" ){ return false; }
      });

      // No errors
      if ( $form.find('.has-error').length === 0 ){
      
        // Basic data gathering
        var tallyObj = formJSON($form);

        // Tags require arrayifying
        var tallyTags = tallyObj['tags'].length > 0 ? tallyObj['tags'].trim().split(/\s*,\s*/) : [];
            tallyObj['tags'] = tallyTags;

        // Collections require arrayifying and...
        var collectionList = [], 
            collections = tallyObj['collections'].length > 0 ? tallyObj['collections'].trim().split(/\s*,\s*/) : [];

        // ...updating on the collection side
        _.forEach(tl.collections,function(c,i){

          // If this collection is in our tally's list...
          if ( collections.indexOf(c.title) !== -1 ){

            // Add the collection id to the tally's list
            collectionList.push(c.id);

            // If the tally id isn't already listed with this collection, add it there too
            if ( c.tallies.indexOf(tally.id) === -1 ){
              c.tallies.push(tally.id);
            }

          } // collection matched

          // Otherwise, if this collection isn't in the tally's list, 
          // we should remove this tally from the collection's list
          else {

            if ( c.tallies.indexOf(tally.id) !== -1 ){
              _.pull(c.tallies,tally.id);
            }

          }

        });

        tallyObj['collections'] = collectionList;

        // Update slug
        tallyObj['slug'] = tallyObj['title'].replace(/\ /g,'-').toLowerCase();

        // Ah you push it push it
        tl.updateTally(tallyObj,tally);

        // Arrakis shuffle
        setTimeout(function(){
          var newPath = URLParser(location.href).removeParam('tally');
          window.location.href = newPath+'&tally='+tallyObj['slug'];
        },tl.syncInterval+500);  

      } // validation success

      else {
        $button.removeClass('loading');
      }
      
      return false;
    });

    // Cancel
    $('#settings .btn-default')
    .off(press+'.cancel')
    .on(press+'.cancel',function(e){
      e.preventDefault();
      window.location.reload(true);
      return false;
    });

    /* Delete Tally */

      $('#settings .btn-link')
      .off(press)
      .on(press,function(e){
        e.preventDefault();
        $('#confirmDeleteTally').modal('show');
        return false;
      });

      // Cancel
      $('#confirmDeleteTally .btn-default')
      .off(press+'.cancelDelete')
      .on(press+'.cancelDelete',function(e){
        e.preventDefault();
        $('#confirmDeleteTally').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
        return false;
      });

      // Download
      $('#confirmDeleteTally .download-csv')
      .off(press)
      .on(press,function(e){
        e.preventDefault();
        var csv = Papa.unparse(tally.counts);
        downloadFile(csv,tally.slug,'csv');
        return false;
      });

      // Confirm
      $('#confirmDeleteTally .btn-danger')
      .off(press+'.delete')
      .on(press+'.delete',function(e){
        e.preventDefault();

        var $button = $(this);
        $button.addClass('loading');

        // Get first collection to redirect after delete
        var collection = $('#settings textarea[name="collections"]').val().split(',');
            collection = collection[0].replace(/\ /g,'-').toLowerCase().trim();

        tl.deleteTally(tally);

        setTimeout(function(){
          window.location.href = '/app/lab/index.html?collection='+collection;
        },tl.syncInterval+500);

        return false;
      });

    // Misc
    everyInit('#settings');

  $('#settings').removeClass('loading').show();

  tourInit(tallySettingsTour);

} // printTallySettings

function calculateDuration(element,start,end){ // jQ obj, unix, unix

  var diff = moment(end) - moment(start);
  var durTime = moment.duration(diff).format('d[d] hh:mm:ss',{forceLength: true});
      durTime = durTime.indexOf(':') !== -1 ? durTime : ':'+durTime;
  var durText = moment.duration(diff).format('d [days], h [hours], m [minutes], s [seconds]');
  $(element).text(durTime).attr('title',durText).removeClass('hidden');
  $(element).closest('.durations').removeClass('hidden');

  return durTime;

} // calculateDuration

// End lab.js