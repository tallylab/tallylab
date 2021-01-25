document.addEventListener('api-ready',loadSecurity);

function loadSecurity(){

  document.removeEventListener('api-ready',loadSecurity);

  // Samsung Browser has an issue with re-encrypt so we're going to prevent those users from doing that.
  var samsungBrowser7 = !!ua.match(/SamsungBrowser\/7/i);
  if ( samsungBrowser7 ){
    $('#samsungReencrypt').removeClass('hidden');
    $('#generateKeysUser a,#generateKeysRandom a').closest('.panel').remove();
  }

  if ( localStorage.getItem('enable_remote_backup') === "return" ){

    $('.tlc-toggle.tlc-standard').addClass('hidden');
    $('.tlc-toggle.tlc-returning').removeClass('hidden');

  } else {

    $('.tlc-toggle.tlc-standard').removeClass('hidden');
    $('.tlc-toggle.tlc-returning').addClass('hidden');

    // Random keys
    if ( tl.encryption.identity.securityVersion === 0.1 || tl.encryption.identity.securityVersion === "0.1" ){

      // User trying to restore from backup, needs to re-up keys
      if ( localStorage.getItem('ipns_hash') && localStorage.getItem('enable_remote_backup') === "restore" ){
        $('#TLidentity .backup-encryption').removeClass('hidden');
      }

      $('#TLidentity .tl-encryption').removeClass('hidden');

    }

    // User keys
    else {
      $('#TLidentity .user-encryption').removeClass('hidden');
    }

    if ( localStorage.getItem('enable_remote_backup') === "reencrypted" ){
      $('#TLidentity .backup-encryption-success').removeClass('hidden');
    }

  }

  $('.launch-tl-security').on('tap',function(e){
    e.preventDefault();

    // Create new encrypted key
    var identity = tl.encryption.keygen();

    // Save it to localStorage
    localStorage.setItem('userPrivate',identity.privateKey);
    localStorage.setItem('userPublic',identity.publicKey);
    localStorage.setItem('userSecurityVersion',0.1);

    // Show Success
    $('#randomKeySuccess').modal('show');

    // Update restore from backup flow, if applicable
    if ( localStorage.getItem('enable_remote_backup') ){
      localStorage.setItem('enable_remote_backup','reencrypted');
    }

    return false;
  });

  $('.email-key').on('tap',function(e){
    var keys = {};
    _.forEach(tl.encryption.identity,function(value,key){
      keys[key] = value.toString();
    });
    $(this).attr('href','mailto:?subject=TallyLab%20Keys&body='+JSON.stringify(keys));
  });

  $('.download-key').on('tap',function(e){
    e.preventDefault();
    var keys = {};
    _.forEach(tl.encryption.identity,function(value,key){
      keys[key] = value.toString();
    });
    downloadFile(JSON.stringify(keys),'tlkeys','txt');
    return false;
  });

  $('.paste-key').on('tap',function(e){
    e.preventDefault();
    digestKeys($('#pastedKeys').val());
    return false;
  });

  $('.import-key').on('tap',function(e){
    e.preventDefault();

    var $button = $(this).addClass('loading');

    // Validate (gotta do this separately from validate.js cause of reasons)
    if ( $('#confirmImportKey input[type=file]').val() === "" ){
      $button.removeClass('loading');
      validationMessaging($('#importKeyForm'),'danger','Gotta have a file, yo');
    }

    // So we have an actual file...
    else {

      $('#importKeyForm .status-messaging').remove();

      var $fileObj = $('#confirmImportKey input[type=file]');

      var reader = new FileReader;

      reader.onload = function(e) {
        digestKeys(reader.result);
      };

      reader.readAsText($fileObj.prop('files')[0]);

    }

    return false;
  });

  $('#userKeySuccess button').on('tap',function(){

    localStorage.removeItem('userPrivate');
    localStorage.removeItem('userPublic');
    localStorage.removeItem('userSecurityVersion');

    window.location.reload(true);

  }); // #userKeySuccess cancel

  if ( window.location.toString().indexOf('/app/settings/questions.html') !== -1 ){

    $(window.location.hash).removeClass('hidden');

    var seed = '', scrollSpeed = 1000;

    // Show first step, focus
    $('#userSecurity fieldset:eq(0)')
      .css('display','block')
      .find('input').focus();

    // Init what happens when "next" is clicked on each step
    $('#userSecurity fieldset button').on('click',function(e){
      e.preventDefault();

      var $curr = $(this).closest('fieldset');

      // If there's anything to validate, validate it
      $curr.find('[data-validation-type]').each(function(){
        domValidation($(this));
      });

      // No errors
      if ( $curr.find('.has-error').length === 0 ){

        // Hide next button forever
        $curr.find('button').remove();

        // If the seed is too short
        if ( seed.length < 32 ){

          // Get value
          var curVal  = $curr.find('input:first').val();

          // Normalize
          curVal  = curVal.trim().replace(' ','').toLowerCase().replace(/[^a-z0-9]/g,'');

          // Append to seed
          seed = seed+curVal;

          // Show next question
          var $next = $curr.next('fieldset').css('display','block');

          // Scroll to it
          $('html, body').animate({
            scrollTop: $next.offset().top-75
          }, scrollSpeed, function(){ $next.find('input').focus(); });

        } // add to seed, continue

        // Otherwise, if there aren't any keys yet but the seed is long enough
        else if ( seed.length >= 32 ){

          // Create new encrypted key
          var identity = tl.encryption.keygen(seed.substr(0,32));

          // Save it to localStorage
          localStorage.setItem('userPrivate',identity.privateKey);
          localStorage.setItem('userPublic',identity.publicKey);
          localStorage.setItem('userSecurityVersion',1);

          // Hide form fields
          $('#userSecurity fieldset').css('display','none');

          // Show Success
          $('#userKeySuccess').modal('show');

          // Update restore from backup flow, if applicable
          if ( localStorage.getItem('enable_remote_backup') ){
            localStorage.setItem('enable_remote_backup','reencrypted');
          }

        } // generateKeys

      } // validation success

      return false;
    });

  }

}

function digestKeys(string){

  try {

    var nuKeys = JSON.parse(string);

    localStorage.setItem('userPrivate',nuKeys.private);
    localStorage.setItem('userPublic',nuKeys.public);
    localStorage.setItem('userSecurityVersion',nuKeys.securityVersion);

    $('#confirmImportKey,#confirmPasteKey').modal('hide');
    $('#importKeySuccess').modal('show');

    // Update restore from backup flow, if applicable
    if ( localStorage.getItem('enable_remote_backup') ){
      localStorage.setItem('enable_remote_backup','reencrypted');
    }

  } catch (error){
    validationMessaging($('#importKeyForm:visible,#pasteKeyForm:visible'),'danger','Your keys are in the wrong format. Try again, or contact us for help.');
  }

}

// end security.js
