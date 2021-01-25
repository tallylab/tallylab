/* 

Author: Jordyn Bonds https://github.com/skybondsor

What is this? 
  formWizard is a set of vanilla JS objects and functions that restructure a form into steps like frames in a filmstrip.

Why write this? Aren't there a million sliders/galleries out there?  
  There sure are! However, few are tooled specifically for the requirements of a stepped form, which meant I kept trying to shoehorn my situation into plugins that were built for almost every other scenario except what I was trying to do.
  On a very basic level what I needed was something to
    1) Animate forward and backwards through pre-defined steps in a pre-defined "window"
    2) Validate each step before allowing it to move forward
    3) Be able to handle several instances on the same page

Usage & Notes:

- Initialize a wizard by calling wizardize('#wizardId')

- Override events via an object as the second argument, a la
    wizardize('#wizardId',{ cancel: function() { confirm("You sure you want to cancel?"); } })

- If something can be specified in the HTML, do it there. If not HTML, CSS. If not CSS, JS.

  Examples: 
    - If a particular step is a "point of no return" (e.g. it's the first step), just don't include a "prev" button in the HTML for that step
    - If a particular step should not be able to advance without validation, hide the "next" button via CSS and reveal when it passes validation
    - If you don't want a flash of content before the JS initializes, make the step height very large via CSS

- Use the default event functions as a guide and then write overrides for your particular situation.

*/

var fadeSpeed = 350, showCSS = { "display": "block", "zIndex": 1 }, hideCSS = { "display": "none", "zIndex": 0 };

var wizards = {}, wAssumptions = {
  
  beforePrev: function(wId,$button){
    
    wizards[wId].prev(wId,$button);

  }, // beforePrev

  prev: function(wId,$button){

    var $curr = $(wId).find('.step:visible');
    var $prev = $curr.prev();

    $curr.animate({
      "opacity" : 0
    },fadeSpeed,function(){

      $curr.css(hideCSS);

      $prev.css(showCSS).animate({ 
        "opacity": 1       
      },fadeSpeed,function(){

        // If we're not on a mobile device, focus on first input
        if ( press === "click" ){
          $button.closest('.step').prev('.step').find(':input:visible,[data-value]:visible,[tabindex="-1"]:visible').eq(0).trigger('focus');
        }

        wizards[wId].afterPrev(wId,$button);

      }); // Fade in

    }); // Fade out

  }, // prev

  afterPrev: function(wId,$button){

  }, // afterPrev
  
  beforeNext: function(wId,$button){ // Great place for validation!

    if ( $(wId).find('.step:visible input:eq(0)').prop('required') && $(wId).find('.step:visible input:eq(0)').val() === "" ){
      $(wId).find('.step:visible input:eq(0)').after(' <span style="color:red;">Required value</span>');
    } else {
      wizards[wId].next(wId,$button);
    }
  
  }, // beforeNext

  next: function(wId,$button){

    var $curr = $(wId).find('.step:visible');
    var $next = $curr.next();

    $curr.animate({
      "opacity" : 0
    },fadeSpeed,function(){

      $curr.css(hideCSS);

      $next.css(showCSS).animate({ 
        "opacity": 1       
      },fadeSpeed,function(){

        // If we're not on a mobile device focus on first input
        if ( press === "click" ){
          $button.closest('.step').next('.step').find(':input:visible,[data-value]:visible,[tabindex="-1"]:visible').eq(0).trigger('focus');
        }

        wizards[wId].afterNext(wId,$button);

      }); // Fade in

    }); // Fade out

  }, // next

  afterNext: function(wId,$button){

  }, // afterNext
  
  beforeFinish : function(wId,$button){ // Great place for validation!

    wizards[wId].finish(wId,$button);

  }, // beforeFinish
  
  finish: function(wId,$button){ // This should be where you submit/save the form

    wizards[wId].cancel(wId,$button);

  }, // finish

  cancel: function(wId,$button){

    var $curr = $(wId).find('.step:visible');

    $curr.animate({
      "opacity" : 0
    },fadeSpeed,function(){

      $curr.css(hideCSS);

      // Replace HTML with original
      $(wId).html(wizards[wId].initialState);

      // Re-init
      wizardize(wId,wizards[wId]); // existing options can just be re-passed as overrides

    }); // Fade out

  } // cancel

} // wAssumptions

function wizardize(wId,wOverrides){

  /* Add wizard and its settings to the `wizards` object */

    // Deregister this wizard if it's already been registered
    if ( wizards[wId] ){
      delete wizards[wId];
    }

    // Register Wizard (in case there are several on the page) and prepopulate with assumptions
    wizards[wId] = wAssumptions;

    // If there be overrides, override
    if ( wOverrides ){
      _.forEach(wOverrides,function(v,k){
        wizards[wId][k] = v;
      }); 
    }

  /* Initialize DOM events */

    $(wId).find('.prev')
    .off(press)
    .on(press,function(e){
      e.preventDefault();

      var $button = $(this);

      wizards[wId].beforePrev(wId,$button);

      return false;
    }); // prev

    $(wId).find('.next')
    .off(press)
    .on(press,function(e){
      e.preventDefault();

      var $button = $(this);

      wizards[wId].beforeNext(wId,$button);

      return false;
    }); // next

    $(wId).find('.finish')
    .off(press)
    .on(press,function(e){
      e.preventDefault();

      var $button = $(this);

      wizards[wId].beforeFinish(wId,$button);

      return false;
    }); // finish

    $(wId).find('.cancel')
    .off(press)
    .on(press,function(e){
      e.preventDefault();

      var $button = $(this);

      wizards[wId].cancel(wId,$button);

      return false;
    }); // cancel
    
    $(wId).find(':input,[data-value],[tabindex="-1"]')
    .off('keydown')
    .on('keydown',function(e){

      var $which = $(this);

      // If we're tabbing...
      if ( e.keyCode === 9 ){

        var $curStep = $which.closest('.step');

        // Note to future self: Error messaging is done in beforePrev and beforeNext, so checking for errors here would be premature

        // Gotta figure out how many tabbables are in the step
        var tabArray = $curStep.find(':input:visible,[data-value]:visible,[tabindex="-1"]:visible');

        // If user is trying to tab backward for navigation from the first input
        if ( e.shiftKey && tabArray.index($which) === 0 && ( $curStep.find('.prev').length === 0 || $curStep.find('.prev').hasClass('hidden') ) ){
          e.preventDefault();
          // prevent navigating via tab
          return false;
        }

        // Otherwise, if user is trying to tab to finish wizard
        if ( !e.shiftKey && tabArray.index($which) === tabArray.length-1 && $curStep.find('.finish').length > 0 && !$curStep.find('.finish').hasClass('hidden') ){
          e.preventDefault();
          //$curStep.find('.finish').trigger('focus');
          wizards[wId].beforeFinish(wId,$curStep.find('.finish'));
          return false;
        }

        // Otherwise, if
        // ... we're tabbing backwards
        // ... this is the first visible input in this step
        // ... there's a previous button to be had
        else if ( e.shiftKey && tabArray.index($which) === 0 && $curStep.find('.prev').length > 0 && !$curStep.find('.prev').hasClass('hidden') ){ 
          e.preventDefault(); 
          wizards[wId].beforePrev(wId,$curStep.find('.prev'));
          return false;
        } 

        // Otherwise, if
        // ... we're tabbing forward
        // ... there aren't any errors
        // ... this is the last visible input
        // ... the "next" button is visible...
        else if ( !e.shiftKey && tabArray.index($which) === tabArray.length-1 && $curStep.find('.next').length > 0 && !$curStep.find('.next').hasClass('hidden') ){
          e.preventDefault();
          wizards[wId].beforeNext(wId,$curStep.find('.next'));
          return false;
        }

      }

    }); // tabbing

    everyInit(wId);

    $(window)
    .off('resize.wizard')
    .on('resize.wizard',function(){
      wizardize(wId,wOverrides);
    });

} // wizardize
