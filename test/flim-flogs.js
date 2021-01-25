/*! Flogger v2
 *  https://github.com/skybondsor/flogger
 *
 *  Flogger uses jQuery and Mousetrap to make it as easy as possible for developers to do non-automated UI testing
 *
 *  Copyright Jordyn Bonds
 *  Released under the MIT license
 */

// These flogs are in the order of how the functionality would arise for a user and should therefore be done in this order
var flogs = {
  newUserIOS: [
    {
      stepDesc: "newUserIOS test loaded",
      stepExec: function(){
        if ( window.location.href.indexOf('lab') !== -1 ){
          window.location = '/app/index.html';
        }
      }
    },
    {
      stepDesc: "iOS 'shadow browser' warning generated"
    },
    {
      stepDesc: "Clicking through from the iOS phantom browser warning loaded app",
      stepExec: function(){
        $('#clickThru').trigger(press);
      }
    }
  ], // newUserIOS
  newUser: [ // Should take ~15 minutes
    {
      stepDesc: "newUser test loaded",
      stepExec: function(){

      }
    },
    {
      stepDesc: "Choose adventure loaded",
      stepExec: function(){

      }
    },
    {
      stepDesc: "Choosing 'new user' reveals welcome screen with collection template options",
      stepExec: function(){
        $('#initialAdventure .new-tallier').trigger(press);
      }
    },
    {
      stepDesc: "Choosing a collection template reveals list of tallies to add",
      stepExec: function(){
        $('#collectionSelection [data-slug]').eq(0).trigger(press);
      }
    },
    {
      stepDesc: "Hitting 'back' returns to list of collection templates",
      stepExec: function(){
        $('#backToCollectionTemplates').trigger(press);
      }
    },
    {
      stepDesc: "'Toggling all' deselects all tallies",
      stepExec: function(){
        $('#collectionSelection [data-slug]').eq(0).trigger(press);
        setTimeout(function(){
          $('#toggleCheckboxButtonList').trigger(press);  
        },500);
      }
    },
    {
      stepDesc: "'Toggling all' selects all tallies",
      stepExec: function(){
        $('#toggleCheckboxButtonList').trigger(press);
      }
    },
    {
      stepDesc: "Tapping a tally deselects it",
      stepExec: function(){
        $('#tallySelection input').eq(0).removeProp('checked').removeAttr('checked').trigger('blur');
        $('.glyph-checkbox.btn').eq(0).removeClass('btn-selected').trigger('blur');
      }
    },
    {
      stepDesc: "Installing collection works, takes you to new collection",
      stepExec: function(){
        $('#installSelectedTallies').trigger(press);
      }
    },
    {
      stepDesc: "Navigating to home shows new collection listed",
      stepExec: function(){
        if ( window.location.href.indexOf('collection=') !== -1 ){
          $('nav .navbar-brand').trigger('click');
        }
      }
    },
    {
      stepDesc: "Clicking new collection name navigates to list of its tallies",
      stepExec: function(){
        if ( window.location.href.indexOf('collection=') == -1 ){
          $('#collections .btn-collection').eq(0).trigger('click');
        }
      }
    },
    {
      stepDesc: "Scrolling starts tour",
      stepExec: function(){
        $("html, body").animate({ scrollTop: $(document).height() }, "slow");
      }
    },
    {
      stepDesc: "Tour next button works",
      stepExec: function(){
        $('.tour-collectionTour.tour button[data-role="next"]').trigger(press);
      }
    },
    {
      stepDesc: "Tour prev button works",
      stepExec: function(){
        $('.tour-collectionTour.tour button[data-role="prev"]').trigger(press);
      }
    },
    {
      stepDesc: "Elements highlight for each step in the tour (manual only)"
    },
    {
      stepDesc: "Clicking 'end tour' ends the tour",
      stepExec: function(){
        $('.tour-collectionTour.tour button[data-role="end"]').trigger(press);
      }
    },
    {
      stepDesc: "Clicking 'continue tour' in the footer picks up where you left off",
      stepExec: function(){
        $('footer.footer .continue-tour').trigger('click');
      }
    },
    {
      stepDesc: "Clicking new tally starts new tally wizard",
      stepExec: function(){
        $('#newTallyWizard a.next').eq(0).trigger(press);
      }
    },
    {
      stepDesc: "Entering nothing triggers appropriate error message",
      stepExec: function(){
        $('#newTallyWizard .next:visible').trigger(press);
      }
    },
    {
      stepDesc: "Entering special characters triggers appropriate error message",
      stepExec: function(){
        $('#tallyName').val('@#$@#$');
        $('#newTallyWizard .next:visible').trigger(press);
      }
    },
    {
      stepDesc: "Entering name of an existing tally triggers appropriate error message",
      stepExec: function(){
        $('#tallyName').val(tl.tallies[0].title);
        $('#newTallyWizard .next:visible').trigger(press);
      }
    },
    {
      stepDesc: "Cancel tally wizard works, clears form fields",
      stepExec: function(){
        $('#newTallyWizard .cancel').trigger(press);
      }
    },
    {
      stepDesc: "New tally wizard 'next' button works",
      stepExec: function(){
        var curFlog = localStorage.getItem('flog');
        $('#tallyName').val(curFlog+" New Tally").trigger('keyup');
        setTimeout(function(){
          $('#newTallyWizard .next:visible').trigger(press);
        },1500);
      }
    },
    {
      stepDesc: "New tally wizard 'back' button works",
      stepExec: function(){
        $('#newTallyWizard .prev:visible').trigger(press);
      }
    },
    {
      stepDesc: "Selecting a goal works",
      stepExec: function(){
        $('#newTallyWizard .next:visible').trigger(press); // advances to goal step
        setTimeout(function(){
          $('#tallyGoal option:last').prop('selected',true);
          $('#tallyGoal').trigger('change');
        },1500);
      }
    },
    {
      stepDesc: "Selecting timer works",
      stepExec: function(){
        $('#newTallyWizard .next:visible').trigger(press);
        setTimeout(function(){
          $('#timer').prop('checked',true).attr('checked','checked').trigger('blur');
          $('#newTallyWizard .glyph-checkbox.btn:visible').addClass('btn-selected').trigger('blur');
        },1500);
      }
    },
    {
      stepDesc: "Entering a value works",
      stepExec: function(){
        $('#goalTotal').val(1); // enters goal total
      }
    },
    {
      stepDesc: "Selecting numeric value works",
      stepExec: function(){
        $('#newTallyWizard .next:visible').trigger(press);
        setTimeout(function(){
          $('#numeric').prop('checked',true).attr('checked','checked').trigger('change');
          $('#newTallyWizard .glyph-checkbox.btn:visible').addClass('btn-selected').trigger('blur');
        },1500);
      }
    },
    {
      stepDesc: "Entering numeric value units works",
      stepExec: function(){
        $('#tallyValueLabel').val('mg');
      }
    },
    {
      stepDesc: "Entering tags works",
      stepExec: function(){
        $('#newTallyWizard .next:visible').trigger(press); // advances to tags step
        setTimeout(function(){
          $('#tallyTags').val('posh, dosh').trigger('keyup');
        },2000);
      }
    },
    {
      stepDesc: "Saving new tally works",
      stepExec: function(){
        $('#newTallyWizard .finish:visible').trigger(press); // finishes making new tally
      }
    },
    {
      stepDesc: "Navigating to All Tallies shows new tally still exists",
      stepExec: function(){
        if ( window.location.href.indexOf("collection=all-tallies") === -1 ){
          window.location.href = "/app/lab/index.html?collection=all-tallies";
        } else {
          setTimeout(function(){
            var curFlog = localStorage.getItem('flog');
            $('html,body').scrollTop($('.tally.box [name="title"]:contains("'+curFlog+' New Tally")').offset().top-80);
          },500);
        }
      }
    },
    {
      stepDesc: "Incrementing tally adds one to the count starts timer",
      stepExec: function(){
        var curFlog = localStorage.getItem('flog');
        $('.tally.box [name="title"]:contains("'+curFlog+' New Tally")').closest('.box-content').find('.tally-count .text-left:visible').trigger(press);
      }
    },
    {
      stepDesc: "Stopping timer prompts for numeric value",
      stepExec: function(){
        var curFlog = localStorage.getItem('flog');
        $('.tally.box [name="title"]:contains("'+curFlog+' New Tally")').closest('.box-content').find('.tally-count .text-left:visible').trigger(press);
      }
    },
    {
      stepDesc: "Tally updates with numeric value that was entered",
      stepExec: function(){
        var curFlog = localStorage.getItem('flog');
        $('.tally.box [name="title"]:contains("'+curFlog+' New Tally")').closest('.box-content').find('form.tally-number input[type="number"]').val(5);
        $('.tally.box [name="title"]:contains("'+curFlog+' New Tally")').closest('.box-content').find('form.tally-number .save').trigger(press);
      }
    },
    {
      stepDesc: "Decrementing the tally subtracts one from the count and updates the date",
      stepExec: function(){
        var curFlog = localStorage.getItem('flog');
        $('.tally.box [name="title"]:contains("'+curFlog+' New Tally")').closest('.box-content').find('.tally-count .text-right:visible').trigger(press);
      }
    },
    {
      stepDesc: "Tally status reflects the goal set up in the wizard",
      stepExec: function(){
        //$('#').trigger(press);
      }
    },
    {
      stepDesc: "When navigating to tally detail, new tally appears with the correct values",
      stepExec: function(){
        var curFlog = localStorage.getItem('flog');
        $('.tally.box [name="title"]:contains("'+curFlog+' New Tally")').closest('a').trigger('click');
      }
    },
    {
      stepDesc: "Open dev tools to localStorage. Confirm existence of an ipns_hash"
    },
    {
      stepDesc: "Confirm existence of last_remote_backup"
    },
    {
      stepDesc: "Change date of last_remote_backup item in localStorage to be 1 day ago"
    },
    {
      stepDesc: "Confirm that eventually a new backup is created"
    },
    {
      stepDesc: "Change securityQreminder item in localStorage to be 8 days ago"
    },
    {
      stepDesc: "Refresh, confirm that you get a warning you that you won't be able to restore from backup"
    },
    {
      stepDesc: "Visit Remote Backup, confirm Remote Backup shows the backup and links to Remote Backups"
    },
    {
      stepDesc: "Click to create new backup now. Confirm that date updates both on the page and in localStorage"
    },
    {
      stepDesc: "Navigate to Security page. Confirm message at top of Security page says user is encrypting with random keys."
    },
    {
      stepDesc: "Click to save your current keys. Confirm the file downloads and that it looks correct."
    },
    {
      stepDesc: "Click to email your current keys. Confirm mail client opens and that the message looks correct."
    }
  ], // newUser
  existingUser: [ // Should take ~ 25 minutes
    {
      stepDesc: "existingUser test loaded",
      stepExec: function(){
        window.location = "/app/lab";
      }
    },
    {
      stepDesc: "Go to Settings & Utilities > Import Data and import a sustantive ZIP of stuff"
    },
    {
      stepDesc: "Clicking 'Custom' launches new collection modal",
      stepExec: function(){
        setTimeout(function(){
          $('#collectionSelection a:last').trigger('click');
        },500);
      }
    },
    {
      stepDesc: "Appropriate error generated when title of new collection left empty",
      stepExec: function(){
        $('#collectionName').trigger('blur');
      }
    },
    {
      stepDesc: "Appropriate error generated when special characters entered for title of new collection",
      stepExec: function(){
        $('#collectionName').val('@#$@#$');
        $('#collectionName').trigger('blur');
      }
    },
    {
      stepDesc: "Canceling new collection clears out new collection box",
      stepExec: function(){
        $('#addCustomCollection button.nevermind').trigger('click');
        setTimeout(function(){
          $('#collectionSelection a:last').trigger('click');
        },2500);
      }
    },
    {
      stepDesc: "Entering name of an existing collection triggers appropriate error message",
      stepExec: function(){
        $('#addCustomCollection').modal('show');
        var egCollection = tl.collections[0].title;
        $('#collectionName').val(egCollection).trigger('blur');
      }
    },
    {
      stepDesc: "Entering new collection name and clicking submit takes you to empty new collection",
      stepExec: function(){
        $('#collectionName').val('Meathead Hangout').trigger('blur');
        $('#addCustomCollection button[type="submit"]').trigger('click');
      }
    },
    {
      stepDesc: "Returning to home shows new collection is still there",
      stepExec: function(){
        if ( window.location.href.indexOf('meathead') !== -1 ){
          window.location = "/app/lab";
        }
      }
    },
    {
      stepDesc: "Make sure auto test is on for the next step."
    },
    {
      stepDesc: "Tally incremented by URL.",
      stepExec: function(){
        if ( window.location.hash === "" ){
          var egTally = tl.getTally(0).slug;
          var egCollection = tl.getCollection(tl.getTally(0).collections[0]).slug;
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'#add';
        }
      }
    },
    {
      stepDesc: "Make sure auto test is on for the next step. If not already, go to Home.",
      stepExec: function(){
        if ( window.location.href.indexOf('&tally') !== -1 ){
          window.location.href = '/app/lab';
        }
      }
    },
    {
      stepDesc: "Tally decremented by URL.",
      stepExec: function(){
        if ( window.location.hash === "" ){
          var egTally = tl.getTally(0).slug;
          var egCollection = tl.getCollection(tl.getTally(0).collections[0]).slug;
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'#sub';
        }
      }
    },
    {
      stepDesc: "Tally data: Incrementing count adds top row",
      stepExec: function(){
        var numericTallies = _.filter(tl.tallies, function(o) { return o.value !== '' && !o.timer ; });
        var egTally = numericTallies[0].slug;
        var egCollection = tl.getCollection(numericTallies[0].collections[0]).slug;
        if ( window.location.href.indexOf('tab=data') === -1 || window.location.href.indexOf(egTally) === -1 ){
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'&tab=data';
        } else {
          setTimeout(function(){
            $('#theTally .tally.box .add-count').trigger(press);
          },500);
        }
      }
    },
    {
      stepDesc: "Tally data: Adding numeric value updates row",
      stepExec: function(){
        $('#theTally .tally.box form.tally-number input[type="number"]').val(5);
        $('#theTally .tally.box form.tally-number .save').trigger(press);
      }
    },
    {
      stepDesc: "Tally data: Decrementing count deletes top row",
      stepExec: function(){
        $('#theTally .tally.box .sub-count').trigger(press);
      }
    },
    {
      stepDesc: "Tally data: Pressing 'play' starts the timer on timer-type tallies",
      stepExec: function(){
        var timerTallies = _.filter(tl.tallies,function(o) { return o.timer === true; });
        var egTally = timerTallies[0].slug;
        var egCollection = tl.getCollection(timerTallies[0].collections[0]).slug;
        if ( window.location.href.indexOf('tab=data') === -1 || window.location.href.indexOf(egTally) === -1 ){
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'&tab=data';
        } else {
          setTimeout(function(){
            $('#theTally .tally.box .start-timer').trigger(press);
          },500);
        }
      }
    },
    {
      stepDesc: "Tally data: Pressing stop on timer-type tally stops the timer, updates the duration, etc.",
      stepExec: function(){
        $('#theTally .tally.box .stop-timer').trigger(press);
      }
    },
    {
      stepDesc: "Tally data: On the data view for a tally with many counts, counts sort in reverse chron by default",
      stepExec: function(){
        var talliesByCount = _.orderBy(tl.tallies, ['count'], ['desc']);
        var egTally = talliesByCount[0].slug;
        var egCollection = tl.getCollection(talliesByCount[0].collections[0]).slug;
        if ( window.location.href.indexOf('tab=data') === -1 || window.location.href.indexOf(egTally) === -1 ){
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'&tab=data';
        }
      }
    },
    {
      stepDesc: "Tally data: On the data view for a tally with more than 25 counts, pagination appears at the bottom.",
      stepExec: function(){
        $('html, body').animate({ scrollTop: $('body').height() },2500);
      }
    },
    {
      stepDesc: "Tally data: Tapping '>' advances counts to next page.",
      stepExec: function(){
        $('#nextPage').trigger(press);
      }
    },
    {
      stepDesc: "Tally data: Tapping '<' reverts counts to previous page.",
      stepExec: function(){
        $('#prevPage').trigger(press);
      }
    },
    {
      stepDesc: "Tally data: Able to update start date for a count",
      stepExec: function(){
        $('#counts .count:eq(0) .add-start').trigger(press);
        setTimeout(function(){
          var now = moment().format('M/D/YY h:mm:ss a');
          $('#counts .count:eq(0) [name="startDate"]').val(now);
          setTimeout(function(){
            $('#counts .count:eq(0) .save.btn').trigger(press);
          },500);
        },500);
      }
    },
    {
      stepDesc: "Tally data: Able to update enddate for a count",
      stepExec: function(){
        $('#counts .count:eq(0) .add-end').trigger(press);
        setTimeout(function(){
          var now = moment().format('M/D/YY h:mm:ss a');
          $('#counts .count:eq(0) [name="endDate"]').val(now);
          setTimeout(function(){
            $('#counts .count:eq(0) .save.btn').trigger(press);
          },500);
        },500);
      }
    },
    {
      stepDesc: "Tally data: Entering an illogical start or end date triggers the proper error",
      stepExec: function(){
        var now = moment().format('M/D/YY h:mm:ss a');
        var then = moment().subtract(5,'days').format('M/D/YY h:mm:ss a');
        $('#counts .count:eq(0) .add-start').trigger(press);
        setTimeout(function(){
          $('#counts .count:eq(0) [name="startDate"]').val(now).trigger('blur');
          $('#counts .count:eq(0) .add-end').trigger(press);
          setTimeout(function(){
            $('#counts .count:eq(0) [name="endDate"]').val(then).trigger('blur');
            setTimeout(function(){
              $('#counts .count:eq(0) .save.btn').trigger(press);
            },500);
          },500);
        },500);
      }
    },
    {
      stepDesc: "Tally data: Entering a logical start or end date clears the error",
      stepExec: function(){
        var now = moment().format('M/D/YY h:mm:ss a');
        var then = moment().subtract(5,'days').format('M/D/YY h:mm:ss a');
        $('#counts .count:eq(0) [name="startDate"]').val(then).trigger('blur');
        $('#counts .count:eq(0) [name="endDate"]').val(now).trigger('blur');
        $('#counts .count:eq(0) .save.btn').trigger(press);
      }
    },
    {
      stepDesc: "Tally data: Able to update the numeric value for a count",
      stepExec: function(){
        $('#counts .count:eq(0) .add-value').trigger(press);
        setTimeout(function(){
          $('#counts .count:eq(0) [name="number"]').val(77);
          setTimeout(function(){
            $('#counts .count:eq(0) .save.btn').trigger(press);
          },500);
        },500);
      }
    },
    {
      stepDesc: "Tally data: Able to update the note for a count",
      stepExec: function(){
        $('#counts .count:eq(0) .add-note').trigger(press);
        setTimeout(function(){
          $('#counts .count:eq(0) [name="note"]').val('Lorem ispum dolor sit amet adipiscing');
          setTimeout(function(){
            $('#counts .count:eq(0) .save.btn').trigger(press);
          },500);
        },500);
      }
    },
    {
      stepDesc: "Tally data: Able to update the location for a count",
      stepExec: function(){
        $('#counts .count:eq(0) .add-geo').trigger(press);
        setTimeout(function(){
          $('#counts .count:eq(0) [name="geoPosition"]').val('Boston, MA');
          setTimeout(function(){
            $('#counts .count:eq(0) .save.btn').trigger(press);
          },500);
        },500);

      }
    },
    {
      stepDesc: "Tally data: Refreshing view maintains edits",
      stepExec: function(){
        if ( window.location.href.indexOf('refreshed=edited') === -1 ){
          window.location = window.location.href+'&refreshed=edited';
        }
      }
    },
    {
      stepDesc: "Tally data: Able to delete a count",
      stepExec: function(){
        if ( window.location.href.indexOf('refreshed=edited') !== -1 ){
          window.location = window.location.href.replace('&refreshed=edited','');
        } else {
          setTimeout(function(){
            $('#counts .count:eq(0) .delete-count').trigger(press);
          },500);
        }
      }
    },
    {
      stepDesc: "Tally data: Refreshing view shows count was deleted",
      stepExec: function(){
        if ( window.location.href.indexOf('refreshed=deleted') === -1 ){
          window.location = window.location.href+'&refreshed=deleted';
        }
      }
    },
    {
      stepDesc: "Tally data: Sparkline chart shows and is accurate (manual-only)"
    },
    {
      stepDesc: "Tally stats: 'Tallying since' prints at the top and makes sense",
      stepExec: function(){
        if ( window.location.href.indexOf('tab=summary') === -1 ){
          $('#theTally .tally-tabs [aria-controls="summary"]').trigger('click');
        }
      }
    },
    {
      stepDesc: "Tally stats: 'Show stats for' dropdown shows only valid options for this tally"
    },
    {
      stepDesc: "Tally stats: 'Show stats for' works, updates page"
    },
    {
      stepDesc: "Tally stats: 'Totals for this period' prints and makes sense",
      stepExec: function(){
        var goalTally = _.find(tl.tallies,function(o) { return o.goalType !== "none" && o.counts.length > 5; });
        var egTally = goalTally.slug;
        var egCollection = tl.getCollection(goalTally.collections[0]).slug;
        if ( window.location.href.indexOf(egCollection) === -1 || window.location.href.indexOf(egTally) === -1 ){
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'&tab=summary';
        }
      }
    },
    {
      stepDesc: "Tally stats: Counts Per Period top-level stats print and makes sense"
    },
    {
      stepDesc: "Tally stats: Counts Per Period chart prints and makes sense"
    },
    {
      stepDesc: "Tally stats: Numeric Values top-level stats print and make sense",
      stepExec: function(){
        var numberTally = _.find(tl.tallies,function(o) { return o.value !== "" && o.counts.length > 5;  });
        var egTally = numberTally.slug;
        var egCollection = tl.getCollection(numberTally.collections[0]).slug;
        if ( window.location.href.indexOf(egCollection) === -1 || window.location.href.indexOf(egTally) === -1 ){
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'&tab=summary';
        }
      }
    },
    {
      stepDesc: "Tally stats: Numeric Values chart prints and makes sense"
    },
    {
      stepDesc: "Tally stats: Durations top-level stats print and make sense",
      stepExec: function(){
        var timerTally = _.find(tl.tallies,function(o) { return o.timer === true && o.counts.length > 5;  });
        var egTally = timerTally.slug;
        var egCollection = tl.getCollection(timerTally.collections[0]).slug;
        if ( window.location.href.indexOf(egCollection) === -1 || window.location.href.indexOf(egTally) === -1 ){
          window.location.href = '/app/lab/index.html?collection='+egCollection+'&tally='+egTally+'&tab=summary';
        }
      }
    },
    {
      stepDesc: "Tally stats: Durations chart prints and makes sense"
    },
    {
      stepDesc: "Tally settings: Entering special characters for a tally name triggers the correct error",
      stepExec: function(){
        if ( window.location.href.indexOf('tab=settings') === -1 ){
          $('#theTally .tally-tabs [aria-controls="settings"]').trigger('click');
        } else {
          setTimeout(function(){
            $('#settings form input[name="title"]').val('@#$@#$').trigger('blur');
          },500);
        }
      }
    },
    {
      stepDesc: "Tally settings: Leaving tally name blank triggers correct error",
      stepExec: function(){
        $('#settings form input[name="title"]').val('').trigger('blur');
      }
    },
    {
      stepDesc: "Tally settings: Editing name validly clears errors",
      stepExec: function(){
        var newName = URLParser(location.href).getParam('tally')+'666';
        $('#settings form input[name="title"]').val(newName).trigger('blur');
      }
    },
    {
      stepDesc: "Tally settings: Saving updates name in tally box, etc.",
      stepExec: function(){
        if ( window.location.href.indexOf('666') === -1 ){
          $('#settings form button[type="submit"]').trigger(press);
        }
      }
    },
    {
      stepDesc: "Tally settings: Editing goal works, saves",
      stepExec: function(){

        if ( localStorage.getItem('flogTrak') !== "goalEdited" ){

          var goalType = $('#tallyGoal option:checked').index() === $('#tallyGoal option').length-1 ? 0 : $('#tallyGoal option:checked').index()+1;
          $('#tallyGoal option').eq(goalType).prop('selected',true);
          $('#tallyGoal').trigger('change').trigger('blur');

          var goalPeriod = $('#goalPeriod option:checked').index() === $('#goalPeriod option').length-1 ? 0 : $('#goalPeriod option:checked').index()+1;
          $('#goalPeriod option').eq(goalPeriod).prop('selected',true);
          $('#goalPeriod').trigger('change').trigger('blur');

          var goalTotal = parseInt($('#goalTotal').val())+1;
          $('#goalTotal').val(goalTotal);

          localStorage.setItem('flogTrak','goalEdited');

          setTimeout(function(){
            $('#settings form button[type="submit"]').trigger(press);
          },1000);

        }

      }
    },
    {
      stepDesc: "Tally settings: Editing timer works, saves",
      stepExec: function(){

        if ( localStorage.getItem('flogTrak') !== "timerEdited" ){

          if ( !$('#timer').prop('checked') ){
            $('#timer')
              .prop('checked',true).attr('checked','checked').trigger('blur')
              .next('glyph-checkbox').addClass('btn-selected').trigger('blur');
          } else {
            $('#timer')
              .removeProp('checked').removeAttr('checked').trigger('blur')
              .next('glyph-checkbox').removeClass('btn-selected').trigger('blur');
          }

          localStorage.setItem('flogTrak','timerEdited');

          setTimeout(function(){
            $('#settings form button[type="submit"]').trigger(press);
          },1000);

        }

      }
    },
    {
      stepDesc: "Tally settings: Editing numeric value works, saves",
      stepExec: function(){

        if ( localStorage.getItem('flogTrak') !== "numericEdited" ){

          if ( !$('#value').prop('checked') ){
            $('#value')
              .prop('checked',true).attr('checked','checked').trigger('blur')
              .next('glyph-checkbox').addClass('btn-selected').trigger('blur');
          } else {
            $('#value')
              .removeProp('checked').removeAttr('checked').trigger('blur')
              .next('glyph-checkbox').removeClass('btn-selected').trigger('blur');
          }

          $('#tallyValueLabel').val('mg');

          localStorage.setItem('flogTrak','numericEdited');

          setTimeout(function(){
            $('#settings form button[type="submit"]').trigger(press);
          },1000);

        }

      }
    },
    {
      stepDesc: "Tally settings: Editing tags works, saves",
      stepExec: function(){

        if ( localStorage.getItem('flogTrak') !== "tagsEdited" ){

          $('#tallyTags').val('fruit, citrus');

          localStorage.setItem('flogTrak','tagsEdited');

          setTimeout(function(){
            $('#settings form button[type="submit"]').trigger(press);
          },1000);

        }

      }
    },
    {
      stepDesc: "Tally settings: Able to add or remove collections from a tally, result checks out",
      stepExec: function(){

        if ( localStorage.getItem('flogTrak') !== "collectionsEdited" ){

          var curColls = tl.getTally({ slug: URLParser(window.location.href).getParam('tally') }).collections;

          var newColls = _.pullAll(tl.collections,curColls);

          var newCollSlugs = '';
          _.forEach(newColls,function(val){
            newCollSlugs = newCollSlugs === '' ? tl.getCollection(val).title : newCollSlugs+', '+tl.getCollection(val).title;
          });

          $('#settings [name="collections"]').val(newCollSlugs);

          localStorage.setItem('flogTrak','collectionsEdited');

          setTimeout(function(){
            $('#settings form button[type="submit"]').trigger(press);
          },1000);

        }

      }
    },
    {
      stepDesc: "Tally settings: Deleting a tally prompts confirmation",
      stepExec: function(){
        if ( window.location.href.indexOf('tally=') === -1 || window.location.href.indexOf('tab=settings') === -1 ){
          var tally = tl.tallies[0];
          var collection = tl.getCollection(tally.collections[0]);
          window.location = '/app/lab/index.html?tab=settings&collection='+collection.slug+'&tally='+tally.slug;
        } else {
          setTimeout(function(){
            $('#settings button[data-target="#confirmDeleteTally"]').trigger(press);
          },1000);
        }
      }
    },
    {
      stepDesc: "Tally settings: Downloading CSV of tally from confirmation dialog works, CSV checks out.",
      stepExec: function(){
        $('#confirmDeleteTally .download-csv').trigger(press);
      }
    },
    {
      stepDesc: "Tally settings: Confirming deletion of a tally redirects to the collection landing, with no sign of the deleted tally",
      stepExec: function(){
        $('#confirmDeleteTally .btn-danger').trigger(press);
      }
    },
    {
      stepDesc: "Filter tallies: Able to filter tallies by tag",
      stepExec: function(){
        $('#filterByTagName .tl-tag').eq(0).trigger(press);
      }
    },
    {
      stepDesc: "Filter tallies: Clearing tally filter reveals all collection tallies",
      stepExec: function(){
        $('#clearFilters .clear').eq(0).trigger(press);
      }
    },
    {
      stepDesc: "Sort tallies: Name, ascending works",
      stepExec: function(){
        $('#sortTallies li:eq(0) a.sort').trigger(press);
      }
    },
    {
      stepDesc: "Sort tallies: Name, descending works",
      stepExec: function(){
        $('#sortTallies li:eq(1) a.sort').trigger(press);
      }
    },
    {
      stepDesc: "Sort tallies: Count, ascending works",
      stepExec: function(){
        $('#sortTallies li:eq(2) a.sort').trigger(press);
      }
    },
    {
      stepDesc: "Sort tallies: Count, descending works",
      stepExec: function(){
        $('#sortTallies li:eq(3) a.sort').trigger(press);
      }
    },
    {
      stepDesc: "Sort tallies: Recency, ascending works",
      stepExec: function(){
        $('#sortTallies li:eq(4) a.sort').trigger(press);
      }
    },
    {
      stepDesc: "Sort tallies: Recency, descending works",
      stepExec: function(){
        $('#sortTallies li:eq(5) a.sort').trigger(press);
      }
    },
    {
      stepDesc: "Collection charts: Charts print",
      stepExec: function(){
        if ( window.location.href.indexOf('tab=charts') === -1 ){
          window.location = window.location.href+'&tab=charts';
        }
      }
    },
    {
      stepDesc: "Collection charts: Charts make sense"
    },
    {
      stepDesc: "Collection charts: Gridlines appear behind charts and make sense"
    },
    {
      stepDesc: "Able to change date range on collection charts and the result makes sense",
      stepExec: function(){
        var nuStart = moment().subtract(3,'month').format('YYYY-MM-DD');
        $('#dateRangeStart').val(nuStart);
        var nuEnd = moment().format('YYYY-MM-DD');
        $('#dateRangeEnd').val(nuEnd);
        setTimeout(function(){
          $('#timeRangeForm form').trigger('submit');
        },500);
      }
    },
    {
      stepDesc: "Collection charts: Charts resize appropriately on window resize (manual-only)"
    },
    {
      stepDesc: "Collection charts: Charts resize appropriately on orientation change (manual-only)"
    },
    {
      stepDesc: "Collection settings: Entering special characters for the collection name triggers the correct error",
      stepExec: function(){
        if ( window.location.href.indexOf('tab=charts') !== -1 ){
          window.location = window.location.href.replace('&tab=charts','&tab=settings');
        } else {
          setTimeout(function(){
            $('#collSettings form input[name="title"]').val('@#$@#$').trigger('blur');
            $('#collSettings .btn-primary').trigger(press);
          },500);
        }
      }
    },
    {
      stepDesc: "Collection settings: Leaving name blank triggers correct error",
      stepExec: function(){
        $('#collSettings form input[name="title"]').val('').trigger('blur');
        $('#collSettings .btn-primary').trigger(press);
      }
    },
    {
      stepDesc: "Collection settings: Able to edit the collection name",
      stepExec: function(){

        if ( localStorage.getItem('flogTrak') !== "collectionTitleEdited" ){

          var curTitle = $('#theCollection h1 span').text();

          $('#collSettings form input[name="title"]').val(curTitle + ' EDITED').trigger('blur');

          localStorage.setItem('flogTrak','collectionTitleEdited');

          setTimeout(function(){
            $('#collSettings .btn-primary').trigger(press);
          },500);

        }
      }
    },
    {
      stepDesc: "Collection settings: Deleting the collection prompts confirmation",
      stepExec: function(){
        $('#collSettings a[href="#confirmDeleteCollection"]').trigger('click');
      }
    },
    {
      stepDesc: "Collection settings: Downloading zip works, checks out",
      stepExec: function(){
        $('#confirmDeleteCollection .download-csv').trigger(press);
      }
    },
    {
      stepDesc: "Collection settings: Deleting collection but keeping all tallies redirects to home, checks out",
      stepExec: function(){
        if ( window.location.href.indexOf('tab=settings') !== -1 ){
          var curColl = URLParser(location.href).getParam('collection');
          var egTallyId = tl.getCollection({ slug : curColl }).tallies[0];
          localStorage.setItem('delcoltal',egTallyId);
          $('#confirmDeleteCollection .btn-danger').trigger(press);
        } else if ( window.location.href.indexOf('?') === -1 ){
          setTimeout(function(){
            $('html, body').animate({ scrollTop: $('body').height() },2500,function(){
              window.location = '/app/lab/index.html?collection=all-tallies';
            });
          },800);
        } else if ( window.location.href.indexOf('all-tallies') !== -1 ){
          setTimeout(function(){
            var egTallyId = parseInt(localStorage.getItem('delcoltal'));
            var egTallyTop = $('#tallies .tally.box.'+tl.getTally(egTallyId).slug).offset().top-80;
            $('html, body').scrollTop(egTallyTop);
            localStorage.removeItem('delcoltal');
          },800);
        }
      }
    },
    {
      stepDesc: "Collection settings: Deleting collection but keeping tallies not unique to this collection redirects to home, checks out",
      stepExec: function(){
        if ( window.location.href.indexOf('all-tallies') !== -1 && !localStorage.getItem('delcoltal') ){ // we're on all tallies, from last test
          // Find collection containing tally with multiple collections specified
          var egTally = _.find(tl.tallies,function(o){ return o.collections.length > 1; });
          var egColl = tl.getCollection(egTally.collections[0]);
          // Go to its settings page
          window.location = '/app/lab/index.html?tab=settings&collection='+egColl.slug;
        } else if ( window.location.href.indexOf('tab=settings') !== -1 ){
          setTimeout(function(){
            var curColl = URLParser(location.href).getParam('collection');
            var egTallyId = tl.getCollection({ slug : curColl }).tallies[0];
            localStorage.setItem('delcoltal',egTallyId);
            $('#confirmDeleteCollection').modal('show');
            // Choose 'keep tallies not unique to this collection'
            $('#confirmDeleteCollection .radios label:eq(1)').trigger('click');
            setTimeout(function(){
              $('#confirmDeleteCollection .btn-danger').trigger(press);
            },500);
          },800);
        } else if ( window.location.href.indexOf('all-tallies') !== -1 ){
          setTimeout(function(){
            var egTallyId = parseInt(localStorage.getItem('delcoltal'));
            var egTallyTop = $('#tallies .tally.box.'+tl.getTally(egTallyId).slug).offset().top-80;
            $('html, body').scrollTop(egTallyTop);
            localStorage.removeItem('delcoltal');
          },800);
        } else if ( window.location.href.indexOf('?') === -1 ){
          setTimeout(function(){
            $('html, body').animate({ scrollTop: $('body').height() },2500,function(){
              window.location = '/app/lab/index.html?collection=all-tallies';
            });
          },800);
        }
      }
    },
    {
      stepDesc: "Collection settings: Deleting collection but deleting all tallies redirects to home, checks out",
      stepExec: function(){
        if ( window.location.href.indexOf('all-tallies') !== -1 && !localStorage.getItem('delcoltal') ){ // we're on all tallies, from last test
          // Find random collection
          var egColl = tl.collections[0];
          // Go to its settings page
          window.location = '/app/lab/index.html?tab=settings&collection='+egColl.slug;
        } else if ( window.location.href.indexOf('tab=settings') !== -1 ){
          setTimeout(function(){
            var curColl = URLParser(location.href).getParam('collection');
            var egTallyId = tl.getCollection({ slug : curColl }).tallies[0];
            localStorage.setItem('delcoltal',egTallyId);
            $('#confirmDeleteCollection').modal('show');
            // Choose 'keep tallies not unique to this collection'
            $('#confirmDeleteCollection .radios label:eq(2)').trigger('click');
            setTimeout(function(){
              $('#confirmDeleteCollection .btn-danger').trigger(press);
            },500);
          },800);
        } else if ( window.location.href.indexOf('all-tallies') !== -1 ){
          setTimeout(function(){
            var egTallyId = parseInt(localStorage.getItem('delcoltal'));
            var egTallyTop = $('#tallies .tally.box.'+tl.getTally(egTallyId).slug).offset().top-80;
            $('html, body').scrollTop(egTallyTop);
            localStorage.removeItem('delcoltal');
          },800);
        } else if ( window.location.href.indexOf('?') === -1 ){
          setTimeout(function(){
            $('html, body').animate({ scrollTop: $('body').height() },2500,function(){
              window.location = '/app/lab/index.html?collection=all-tallies';
            });
          },800);
        }
      }
    },
    {
      stepDesc: "Home: Collection statuses and badges make sense",
      stepExec: function(){
        if ( window.location.href.indexOf('?') !== -1 ){
          window.location = '/app/lab/index.html';
        }
      }
    },
    {
      stepDesc: "All Tallies indeed shows all tallies (manual-only)"
    },
    {
      stepDesc: "Tally created on All Tallies screen indeed has no collection affiliation (manual-only)"
    },
    {
      stepDesc: "In a separate tab, open Stripe Dashboard, make sure 'Viewing test data' is on, and then delete any customers you plan on testing with."
    },
    {
      stepDesc: "Go to Admin > Billing."
    },
    {
      stepDesc: "Confirm that error messaging on form makes sense if you don't enter values or enter weird ones."
    },
    {
      stepDesc: "Select ONE-TIME for a billing cycle, and enter any amount, click Pay with Stripe, enter testing creds, submit. Confirm page refreshes showing your payment."
    },
    {
      stepDesc: "Select MONTHLY for a billing cycle, and enter any amount, click Pay with Stripe, enter testing creds, submit. Confirm page refreshes showing your payment."
    },
    {
      stepDesc: "Select YEARLY for a billing cycle, and enter any amount, click Pay with Stripe, enter testing creds, submit. Confirm page refreshes showing your payment."
    },
    {
      stepDesc: "Click the 'cancel' link in the payment message. Confirm page refreshes and shows your last payment."
    },
    {
      stepDesc: "Go to Security section. Click to Generate New Keys from Questions. Click 'Answer Some Questions'. Confirm new page shows first question only."
    },
    {
      stepDesc: "Confirm that clicking 'Next Question' without entering anything results in field-is-required error."
    },
    {
      stepDesc: "Enter answer, click Next Question. Confrim next question loads and page scrolls to it."
    },
    {
      stepDesc: "Continue until seed is generated. Confirm modal launches explaining next steps."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with answers to security questions."
    },
    {
      stepDesc: "Navigate to Lab landing. Confirm the data is there, loads without error, etc."
    },
    {
      stepDesc: "Open dev tools to localStorage. Confirm existence of an ipns_hash"
    },
    {
      stepDesc: "Confirm existence of last_remote_backup"
    },
    {
      stepDesc: "Visit Remote Backup, confirm Remote Backup shows the backup and links to Remote Backups"
    },
    {
      stepDesc: "Visit Billing, confirm the correct billing history is displayed."
    }
  ], // existingUser
  returningUserKeys: [
    {
      stepDesc: "returningUser test loaded"
    },
    {
      stepDesc: "Confirm 'choose adventure' loaded"
    },
    {
      stepDesc: "Confirm choosing 'returning user' takes you to modified Security page"
    },
    {
      stepDesc: "Click to Overwrite current keys with saved keys. Confirm modal launches explaining next steps."
    },
    {
      stepDesc: "Click Import Now. Confirm proper error messaging since you didn't choose a file."
    },
    {
      stepDesc: "Choose the keys you downloaded as part of the newUser test. Click Import Now. Confirm the modal changes to success."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with random keys (the type from your original download)."
    },
    {
      stepDesc: "Click to navigate to Remote Backups. Confirm your last backup is eventually found."
    },
    {
      stepDesc: "Click to restore to last backup. Confirm you are taken to Home and your data is there."
    }
  ],
  returningUserAnswers: [
    {
      stepDesc: "returningUser test loaded"
    },
    {
      stepDesc: "Confirm 'choose adventure' loaded"
    },
    {
      stepDesc: "Confirm choosing 'returning user' takes you to modified Security page"
    },
    {
      stepDesc: "Click to Answer questions. Confirm page loads with security questions."
    },
    {
      stepDesc: "Enter the exact answers you gave during the existingUser test."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with answers to our questions."
    },
    {
      stepDesc: "Click to navigate to Remote Backups. Confirm your last backup is eventually found."
    },
    {
      stepDesc: "Click to restore to last backup. Confirm you are taken to Home and your data is there."
    },
    {
      stepDesc: "Add an item in localStorage called 'payment_provider' whose value is 'Stripe'. Navigate to Billing."
    },
    {
      stepDesc: "Confirm you see 'we're unable to verify your billing history' message at the top."
    },
    {
      stepDesc: "Scroll down and click 'How to reset your StripeID'."
    },
    {
      stepDesc: "Enter nothing, funny characters, etc. to test error messaging. Confirm it looks ok"
    },
    {
      stepDesc: "Enter actual customer id used during existingUser test, minus the 'cus_' at the beginning. Confirm the page refreshes and the payment info at the top is correct."
    }
  ], // returningUser
  correlator: [
    {
      stepDesc: "Clicking to start tour launches Correlator tour, which behaves as expected"
    },
    {
      stepDesc: "Correlator loads with just the tally select"
    },
    {
      stepDesc: "Choosing a tally reveals data type select, with appropriate options for the tally that was selected"
    },
    {
      stepDesc: "Choosing a data type reveals chart-type select, with appropriate options for the data type selected"
    },
    {
      stepDesc: "Able to add a timeline chart to Correlator"
    },
    {
      stepDesc: "Able to add a line chart to Correlator"
    },
    {
      stepDesc: "Able to add a scatter plot chart to Correlator"
    },
    {
      stepDesc: "Able to add a scatter plot w/ trendline chart to Correlator"
    },
    {
      stepDesc: "Able to add a vertical bar chart to Correlator"
    },
    {
      stepDesc: "Able to add a gantt chart to Correlator"
    },
    {
      stepDesc: "Gridlines appear behind charts and they make sense"
    },
    {
      stepDesc: "Correlator charts makes sense"
    },
    {
      stepDesc: "Able to change date range on Correlator and the result makes sense"
    },
    {
      stepDesc: "Correlator charts resize appropriately on window resize"
    },
    {
      stepDesc: "Correlator charts resize appropriately on orientation change"
    },
    {
      stepDesc: "Tooltips appear upon hovering over (desktop) or clicking on (mobile) a chart and the text inside makes sense"
    }
  ], // correlator
  settingsUtilities: [
    {
      stepDesc: "settingsUtilities test loaded",
      stepExec: function(){
        if ( window.location.href.indexOf('settings') === -1 ){
          window.location = '/app/settings/index.html';
        }
      }
    },
    {
      stepDesc: "Export Data opens"
    },
    {
      stepDesc: "Export Everything to .ZIP works when clicked"
    },
    {
      stepDesc: "The unzipped exported DB looks correct, CSVs are coherent"
    },
    {
      stepDesc: "Import Data opens"
    },
    {
      stepDesc: "Edits to exported DB correctly update DB when rezipped and re-imported"
    },
    {
      stepDesc: "Things Being Weird? opens"
    },
    {
      stepDesc: "Download .ZIP works when clicked"
    },
    {
      stepDesc: "CleanDB runs"
    },
    {
      stepDesc: "CleanDB leaves Collections, Tallies intact"
    },
    {
      stepDesc: "Reset TallyLab opens"
    },
    {
      stepDesc: "Download .ZIP works when clicked"
    },
    {
      stepDesc: "Delete Tally Data deletes tallies/collections but leaves identity/settings"
    },
    {
      stepDesc: "Resetting TallyLab erases current DB and starts over"
    }
  ], // settingsUtilties
  security: [
    {
      stepDesc: "Navigate to Security page. Confirm message at top of Security page says user is encrypting with random keys."
    },
    {
      stepDesc: "Click to save your current keys. Confirm the file downloads and that it looks correct."
    },
    {
      stepDesc: "Click to email your current keys. Confirm mail client opens and that the message looks correct."
    },
    {
      stepDesc: "Click to Generate New Keys from Questions. Click Answer Some Questions. Confirm new page shows first question only."
    },
    {
      stepDesc: "Confirm that clicking Next Question results in field-is-required error."
    },
    {
      stepDesc: "Enter answer, click Next Question. Confrim next question loads and page scrolls to it."
    },
    {
      stepDesc: "Continue until seed is generated. Confirm modal launches explaining next steps."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with answers to security questions."
    },
    {
      stepDesc: "Navigate to Lab landing. Confirm the data is there, loads without error, etc."
    },
    {
      stepDesc: "Return to Security. Click to Overwrite current keys with saved keys. Confirm modal launches explaining next steps."
    },
    {
      stepDesc: "Click Import Now. Confirm proper error messaging since you didn't choose a file."
    },
    {
      stepDesc: "Choose a file. Click Import Now. Confirm the modal changes to success."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with random keys (the type from your original download)."
    },
    {
      stepDesc: "Navigate to Lab landing. Confirm the data is there, loads without error, etc."
    },
    {
      stepDesc: "In a separate tab, open Stripe Dashboard, make sure 'Viewing test data' is on, and then delete any customers you plan on testing with."
    },
    {
      stepDesc: "Navigate to Billing. Add a payment. Confirm your payment went through and is reflected in the Billing page messaging."
    },
    {
      stepDesc: "Navigate to Security. Click to Generate New Keys from Questions. Click Answer Some Questions. Confirm first question loads and page scrolls to it."
    },
    {
      stepDesc: "Confirm that clicking Next Question results in field-is-required error."
    },
    {
      stepDesc: "Enter answer, click Next Question. Confrim next question loads and page scrolls to it."
    },
    {
      stepDesc: "Continue until seed is generated. Confirm modal launches explaining next steps."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with answers to security questions."
    },
    {
      stepDesc: "Navigate to Lab landing. Confirm the data is there, loads without error, etc."
    },
    {
      stepDesc: "Navigate to Settings. Import ZIP of a fully loaded, long-running TL account."
    },
    {
      stepDesc: "Navigate to Lab landing. Confirm the data is there, loads without error, etc."
    },
    {
      stepDesc: "Return to Security. Click to Generate New Random Keys. Confirm modal launches explaining next steps."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with random keys."
    },
    {
      stepDesc: "Navigate to Lab landing. Confirm the data is there, loads without error, etc."
    },
    {
      stepDesc: "Open Console. Delete `stripe.customer_id` localStorage item."
    },
    {
      stepDesc: "Return to Security. Click to Overwrite current keys with saved keys. Confirm modal launches explaining next steps."
    },
    {
      stepDesc: "Click Import Now. Confirm proper error messaging since you didn't choose a file."
    },
    {
      stepDesc: "Choose the file you previously downloaded. Click Import Now. Confirm the modal changes to success."
    },
    {
      stepDesc: "Click to Start Database Conversion in modal. Confirm re-encrypt page loads with stern warning not to navigate away."
    },
    {
      stepDesc: "Confirm page returns to Security, with a new message saying user is encrypting with random keys (the type from your original download)."
    },
    {
      stepDesc: "Navigate to Lab landing. Confirm the data is there, loads without error, etc."
    }
  ]
}; // flogs

function flogNext(){

  // Remove errors
  $('#flogDesc .flog-error').remove();

  // Get log, current test index
  var logLength = JSON.parse(localStorage.getItem('flogLog')).length;
  var curTest   = parseInt(localStorage.getItem('flogTest'));

  // If user has logged this test, continue
  if ( logLength-1 >= curTest ){
    runFlog(localStorage.getItem('flog'),'next');
  }

  // Otherwise, error
  else {
    $('#flogDesc').append('<p class="flog-error">You did not log the status for this test yet.</p>');
  }
} // flogNext

function flogAuto(){

  // Are we currently automatically running tests?
  var curAuto = localStorage.getItem('flogAuto');

  // If no, start autotest
  if ( !curAuto || curAuto === "off" ){
    localStorage.setItem('flogAuto','on');
    $('#flogAuto').text('on');
  }

  // Otherwise, stop autotest
  else {
    localStorage.setItem('flogAuto','off');
    $('#flogAuto').text('off');
  }

} // flogAuto

function testPass(){
  logTest('pass');
} // testPass

function testFail(){
  logTest('FAIL');
} // testFail

function flogEnd(){
  runFlog(localStorage.getItem('flog'),'end');
} // flogEnd

function flogLoc(){

  var curLoc = localStorage.getItem('flogLoc');

  if ( !curLoc || curLoc === "top" ){
    localStorage.setItem('flogLoc','bottom');
    $('#flogDesc').addClass('bottom');
  } else {
    localStorage.setItem('flogLoc','top');
    $('#flogDesc').removeClass('bottom');
  }

} // flogLoc

function runFlog(theFlog,action){

  // On page load
  if ( action === "load"){

    var curAuto = localStorage.getItem('flogAuto') ? localStorage.getItem('flogAuto') : 'off';
    var curLoc  = localStorage.getItem('flogLoc') ? localStorage.getItem('flogLoc') : 'top';

    // Add flogger elements to DOM
    $('body').append('<div id="flogDesc" class="'+curLoc+'"><p class="flog-buttons"><a href="#" class="flog-end">end</a><a href="#" class="flog-auto">auto: <span id="flogAuto">'+curAuto+'</span></a><a href="#" class="flog-loc"></a><a href="#" class="flog-fail">fail</a><a href="#" class="flog-pass">pass</a></p><p class="flog-desc">'+theFlog+' flog loaded</p></div>');
    $('body').append('<div id="flogShortcuts" class="hidden"><p>a | toggle auto-test</p><p>s | end test</p><p>f | test failed</p><p>j | test passed</p><p>k | toggle location of test</p><p>l | toggle visibility of test</p><p>; | toggle shortcuts</p></div>');

    // Init those elements
    // $('#flogDesc .flog-next').on('click',function(e){ e.preventDefault(); flogNext(); return false; });
    $('#flogDesc .flog-auto').on('click',function(e){ e.preventDefault(); flogAuto(); return false; });
    $('#flogDesc .flog-pass').on('click',function(e){ e.preventDefault(); testPass(); return false; });
    $('#flogDesc .flog-fail').on('click',function(e){ e.preventDefault(); testFail(); return false; });
    $('#flogDesc .flog-end').on('click', function(e){ e.preventDefault(); flogEnd();  return false; });
    $('#flogDesc .flog-loc').on('click', function(e){ e.preventDefault(); flogLoc();  return false; });

    // Init keyboard shortcuts, if poss
    if ( Mousetrap ){

      // a |  toggle whether tests are automatically executed or not
      Mousetrap.bind('a',flogAuto);

      // s | end test
      Mousetrap.bind('s',flogEnd);

      // f | test failed
      Mousetrap.bind('f',testFail);

      // j | test passed
      Mousetrap.bind('j',testPass);

      // k | toggle desc location
      Mousetrap.bind('k',flogLoc);

      // l | toggle description visibility
      Mousetrap.bind('l', function(){
        $('#flogDesc').toggleClass('hidden');
      });

      // ; | toggle shortcuts visibility
      Mousetrap.bind(';', function(){
        $('#flogShortcuts').toggleClass('hidden');
      });

    }

  }

  // If we haven't added flogger items to localStorage yet
  if ( !localStorage.getItem('flog') ){

    // Add flogger items to localStorage
    localStorage.setItem('flog',theFlog);
    localStorage.setItem('flogLog','[]');
    localStorage.setItem('flogTest',0);

  } // test setup

  // Otherwise, we're mid-test, so get to it
  else {

    // Cast & Crew
    var curFlog = localStorage.getItem('flog');
    var curLog  = localStorage.getItem('flogLog');
    var curTest = action === 'next' ? parseInt(localStorage.getItem('flogTest'))+1 : parseInt(localStorage.getItem('flogTest'));

    // If we're past the last test
    if ( curTest === flogs[theFlog].length || action === "end" ){

      // Announce it's over
      var endFlogHTML = theFlog+' has ended<br /><textarea class="form-control" id="logText">'+localStorage.getItem('flogLog')+'</textarea><br />The Log has been selected so you can copy/paste at your leisure.';
      $('#flogDesc').html(endFlogHTML);
      setTimeout(function(){
        $("#logText").trigger('select');
      },500);

      // Unload
      localStorage.removeItem('flog');
      localStorage.removeItem('flogLog');
      localStorage.removeItem('flogTest');

    } // end test

    // Otherwise, we're mid-test so get to it
    else {

      // If auto-test is on, and this step has an auto-test function defined...
      if ( localStorage.getItem('flogAuto') === "on" && typeof flogs[curFlog][curTest].stepExec === "function" ) {

        // Execute the test
        flogs[curFlog][curTest].stepExec();
      }

      // If runFlog is coming from logTest...
      if ( action === "next" ){

        // Advance the counter
        localStorage.setItem('flogTest',curTest);
      }

      // Either way, update description
      var curDesc = flogs[curFlog][curTest].stepDesc;
      $('#flogDesc .flog-desc').text(curDesc);

    } // advance test
  } // test continue
} // runFlog

function logTest(status){

  // Cast & Crew
  var testLog = localStorage.getItem('flogLog') ? JSON.parse(localStorage.getItem('flogLog')) : [];
  var curTest = parseInt(localStorage.getItem('flogTest'));
  var curFlog = localStorage.getItem('flog');
  var curDesc = flogs[curFlog][curTest].stepDesc;

  // Create new test report
  var newReport = {
    status: status,
    test:   curDesc
  };

  // Append new report to log
  testLog[curTest] = newReport;

  // Update localStorage item
  localStorage.setItem('flogLog',JSON.stringify(testLog));

  // Advance
  flogNext();
} // logTest

// end flim-flogs.js
