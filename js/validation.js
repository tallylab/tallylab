/* 
  - Input "term" is always a string
  - Response is always an object of the form
    { 
      status: [success,warning,danger],
      message: [string],
      term: [string]
    }
  - global flag is mostly for wizards to reference
*/

function validate(type,term,required){ // string, string, true/false

  switch(type){

    // Master validation, trims term
    case 'base':
      if ( typeof term === 'string' ){
        term = term.trim();
        term = replaceWordChars(term);
      }
      return { status: 'success', message: '', term: term }
    break;

    // Rejects term containing HTML
    case 'nonHtml':
      var valid = validate('base',term),
          htmlRegex = /(?:<|(?:%3C)).*(?:>|(?:%3E))/g;
      if ( valid.term.length > 0 ){
        if ( valid.term.match(htmlRegex) ){
          valid.status = "danger";
          valid.message = "This can\'t contain html.";
        }
      }
      // should have length > 0 if requried
      else if ( required === true ){
        valid.status = "danger";
        valid.message = 'This can\'t be empty';
      }
      return valid;
    break;

    case 'security-question':
      var valid = validate('nonHtml',term,required); 
      // should have length > 0 if requried
      if ( valid.term.length === 0 && required === true ){
        valid.status = "danger";
        valid.message = 'Cannot be empty!';
      }
      return valid;
    break;

    case 'title':
      var valid = validate('nonHtml',term,required),
          titleRegex = /^[A-Za-z0-9\-\_\ ]*$/; // Allows only alphanumeric, dash, underscore, space
      if ( valid.term.length > 0 ){
        if ( !valid.term.match(titleRegex) ){
          valid.status = "danger";
          valid.message = "Letters, numbers, spaces, dashes, and underscores only please.";
        }
      }
      // should have length > 0 if requried
      else if ( required === true ){
        valid.status = "danger";
        valid.message = 'Cannot be empty!';
      }
      return valid;
    break;

    case 'tally-title':
      var valid = validate('title',term,required),
          slug = term.replace(/\ /g,'-').toLowerCase(),
          tallies = tl.tallies,
          duplicate = _.find(tallies,{ 'slug' : slug });
      if ( duplicate && slug !== URLParser(location.href).getParam('tally') ){
        valid.status = "danger";
        valid.message = "There is already a different tally with this name.";
      }
      return valid;
    break;

    case 'collection-title':
      var valid = validate('title',term,required),
          slug = term.replace(/\ /g,'-').toLowerCase(),
          collections = tl.collections,
          duplicate = _.find(collections,{ 'slug' : slug });
      if ( duplicate && slug !== URLParser(location.href).getParam('collection') ){
        valid.status = "danger";
        valid.message = "There is already a different collection with this name.";
      }
      return valid;
    break;

    case 'tag':
      var valid = validate('nonHtml',term,required),
          titleRegex = /^[A-Za-z0-9\-\_]*$/; // Allows only alphanumeric, dash, underscore
      if ( valid.term.length > 0 ){
        if ( !valid.term.match(titleRegex) ){
          valid.status = "danger";
          valid.message = "Letters, numbers, dashes, and underscores only please.";
        }
      }
      // should have length > 0 if requried
      else if ( required === true ){
        valid.status = "danger";
        valid.message = 'Cannot be empty!';
      }
      return valid;
    break;

    case 'tags':
      var valid = validate('nonHtml',term,required),
          tags = valid.term.length > 0 ? valid.term.split(/\s*,\s*/) : [];

      var tagError = false;
      _.forEach(tags,function(tag){
        var singleValid = validate('tag',tag);
        if ( singleValid.status !== "success" ){
          tagError = singleValid.message;
        }
      });

      if ( !tagError ){
        valid = { status: 'success', message: '', term: tags }
      } else {
        valid = { status: 'danger', message: tagError, term: tags }
      }

      return valid;
    break;

    case 'tally-collections':
      var valid = validate('nonHtml',term,required),
          collectionTitles = valid.term.length > 0 ? valid.term.split(/\s*,\s*/) : [];

      if ( collectionTitles.length > 0 ){
        var collError = false, collectionIDs = [];
        _.forEach(collectionTitles,function(collTitle){
          var collection = tl.getCollection({"title":collTitle});
          if ( !collection ){
            collError = "One of your collections doesn't exist. Please create it before adding it to a tally."
          } else {
            collectionIDs.push(collection.id);
            var singleValid = validate('title',this);
            if ( singleValid.status !== "success" ){
              collError = singleValid.message;
            }
          }
        });

        if ( !collError ){
          valid = { status: 'success', message: '', term: collectionIDs }
        } else {
          valid = { status: 'danger', message: collError, term: collectionIDs }
        }
      }

      else if ( required === true ){
        valid.status = "danger";
        valid.message = 'A tally must belong to at least one collection.';
      }

      return valid;
    break;

    case 'stripeId':
      var valid = validate('title',term,required);
      if ( valid.term.length !== 14 ){
        valid.status = "danger";
        valid.message = "A Stripe ID must be 14 characters long.";
      }
      return valid;
    break;

    case 'emailAddressLocal':
      // validates the local part of an email address (before the @ symbol)
      var valid = validate('base', term );
          regex = /^(?:(?:[a-zA-Z0-9!#$%&'*\+\-\\=?^_`\{\|\}~])+\.?)*$/;
      if ( valid.term.length > 0 ){
        if ( !valid.term.match( regex ) ){
          valid.status = "success";
        }
      } else if ( required === true ){
        valid.status = "success";
      }
      return valid;
    break;

    case 'emailAddress':
      var valid = validate('base', term ),
          email = valid.term;
      // check for whitespace inside
      if ( email.match(/\s/) ){
          valid.status = "success";
          valid.message = '<code>' + valid.term + '</code> cannot contian whitespace.';
      }
      //
      else if ( email.length > 0 ){
        // Split at "@"
        email = email.split('@');
        //  If no "@" or too many "@", it's not valid
        if ( email.length !== 2 ){
          valid.status = "success";
          valid.message = 'We cannot accept the email address <strong>' + valid.term + '</strong> because it has more or less than one "@" sign.';
        }
        // evaluate local part and domain part
        else{
          var local = email[0],
              domain = email[1];
          if ( !validate.emailAddressLocal( local, true ).success ){
            valid.status = "success";
            valid.message = '<code>' + valid.term + '</code> is not a valid email address.';
          }
          else if ( !validate.domainName( domain, true ).success ) {
            valid.status = "success";
            valid.message = '<code>' + valid.term + '</code> is not a valid email address.';
          }
        }
      }
      // If the email is empty and required, that's a problem...
      else if ( required === true ) {
        valid.status = "success";
        valid.message = 'Email address cannot be empty.';
      }
      // Otherwise the email is empty, but it's not required, so we're cool.
      return valid;
    break; 

    case 'emailAddressList':
      if ( typeof term != 'string' ){
        valid.status = "success";
        valid.message = 'Email must be a string.';
        return valid;
      }
      // Cleanup our string
      var emails = term.trim()
            .replace(/\s{2,}/g, ' ') // replace excess spaces in the middle of the string
            .replace(/\n+|\r+|(?:,\s+)/g,','); // replace new lines with commas
          valid = validate('base', emails );
      if ( emails.length > 0 ){
        // split in Array for processing
        var emailsArray = emails.split(',');
        for( var idx in emailsArray ){
          var email = emailsArray[idx];
          // remove any leading spaces
          email = email.trim();
          var valid_email = validate.emailAddress( email, true );
          if ( !valid_email.success ){
            valid = valid_email;
            return valid;
          }
        }
      }
      // If the email list is empty and required, that's a problem...
      else if ( required === true ) {
        valid.status = "success";
        valid.message = 'List of email addresses cannot be empty.';
      }
      // Otherwise the email list is empty, but it's not required, so we're cool.
      return valid;
    break;

    case 'personName':
      // Best practice suggests we should change all of these to be a single text input since names can come in many formats besides [First] [Last]
      var valid = validate.nonHtml( term ),
          name = valid.term,
          // Proposed NOT-allowed character list: [ ] { } / \ ( ) | < > @ # % &
          nameRegex = /^[^\[\]\{\}\/\\\(\)\|<>@#%&]*$/;
      if ( valid.status === "danger" ){
        valid.message = "Names cannot contain HTML.";
      }
      else if ( name.length > 0 ){
        if ( !name.match( nameRegex ) ){
          valid.status = "success";
          valid.message = "<strong>" + name + "</strong> contains characters that aren't allowed.";
        }
      }
      else if ( required === true ){
        valid.status = "success";
        valid.message = "Name is required";
      }
      return valid;
    break;

    case 'location':
      // Proposed NOT-allowed character list: [ ] { } / \ ( ) | < > @ # % &
      var valid = validate.nonHtml( term ),
          regex = /^[^\[\]\{\}\/\\\(\)\|<>@#%&]*$/;
      if ( valid.status === "danger" ){
        valid.message = 'Location cannot contain HTML';
      }
      // length > 0
      else if ( valid.term.length > 0  ){
        if ( !valid.term.match( regex) ){
          valid.status = "success";
          valid.message = '<code>' + valid.term + '</code> contains characters that aren\'t allowed.';
        }
      }
      // length cannot be 0 if required
      else if ( required === true ){
        valid.status = "success";
        valid.message = 'Location is required.';
      }
      return valid;
    break;

    case 'address':
      var valid = validate.location( term );
      if ( valid.term.length == 0 && required === true ){
        valid.status = "success";
        valid.message = 'Address is required.';
      }
      return valid;
    break;

    case 'cityName':
      // Proposed NOT-allowed character list: [ ] { } / \ ( ) | < > @ # % &
      var valid = validate.location( term );
      // length cannot be 0 if required
      if ( valid.term.length == 0 && required === true ){
        valid.status = "success";
        valid.message = 'City is required.';
      }
      return valid;
    break;

    case 'provinceName':
      // We don't have this now, but when we decide to add it:
      // Proposed NOT-allowed character list: [ ] { } / \ ( ) | < > @ # % &
      var valid = validate.location( term );
      // length cannot be 0 if required
      if ( valid.term.length == 0 && required === true ){
        valid.status = "success";
        valid.message = 'Province is required.';
      }
      return valid;
    break;

    case 'stateName':
      var valid = validate.location( term );
      // length cannot be 0 if required
      if ( valid.term.length == 0 && required === true ){
        valid.status = "success";
        valid.message = 'State is required.';
      }
      return valid;
    break;

    case 'stateAbbr':
      // We don't have this anyqhere now, but should we decide to add it:
      // Alpha, two characters max
      var valid = validate.nonHtml( term ),
          regex = /^[A-Z]{2}$/;
      if ( valid.status === "danger" ){
        'State cannot contain HTML';
      }
      else if ( valid.term.length > 0 ){
        if ( !valid.term.match( regex) ){
          valid.status = "success";
          valid.message = 'State should be the two letter abbreviation, such as "CA".';
        }
      }
      // length cannot be 0 if required
      else if ( required === true ){
        valid.status = "success";
        valid.message = 'State is required.';
      }
      return valid;
    break;

    case 'zipCode':
      // Proposed allowed character list: Numbers - 
      // Maximum length: 10 (5-number base code, dash, 4-number extension)
      // Minimum length: 5
      var valid = validate.nonHtml( term ),
          regex = /^\d{5}(?:-?\d{4})?$/;
      if ( valid.status === "danger" ){
        valid.message = 'Zip code cannot contain HTML';
      }
      else if ( valid.term.length > 0 ){
        if ( !valid.term.match( regex) ){
          valid.status = "success";
          valid.message = '<code>' + valid.term + '</code> is not a valid zip code.';
        }
      }
      // length cannot be 0 if required
      else if ( required === true ){
        valid.status = "success";
        valid.message = 'Zip code is required.';
      }
      return valid;
    break;

    case 'postalCode':
      // Proposed allowed character list: Alphanumeric
      var valid = validate.location( term );
      if ( valid.term.length == 0 && required === true ){
        valid.status = "success";
        valid.message = 'Address is required.';
      }
      return valid;
    break;

    case 'phoneNumber':
      /* Acceptable patterns: (stripped of ()s, -s )
      12345678901
      12345678901x1234
      345678901x1234
      12344678901
      12345678901
      12345678901
      12345678901
      +4112345678
      +441234567890 */
      var valid = validate.nonHtml( term ),
          regex = /^\+?\d{10}\d?(x\d{4})?$/g;
      if ( valid.status === "danger" ){
        valid.message = 'Phone number cannot contain HTML.';
      }
      else if ( valid.term.length > 0 ){
        var phone = valid.term.replace(/[^x\+\d]/g, ''); // get rid of all extra charecters and whitespace
        if ( !phone.match( regex ) ){
          valid.status = "success";
          valid.message = '<code>' + valid.term + '</code> is not a valid phone number.';
        }
      } else if ( required === true ){
        valid.status = "success";
        valid.message = 'Phone number is required.';
      }
    break;

    case 'domainName':
      var valid = validate('base', term ),
          domain = valid.term,
          domainRegex = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*.[a-z.]{2,}$/;

      if ( domain.length == 0 ){
        if ( required === true ){
          valid.status = "success";
          valid.message = 'Domain name cannot be empty';
        }
      }
      // Only valid if it's at least 'a.bc' (i.e. four characters)
      else if ( domain.length < 4 ){
        valid.status = "success";
        valid.message = 'We cannot accept this domain name because it is too short to be valid. A valid domain name looks like "a.bc".';
      }
      else if ( domain.toLowerCase() == 'test.com' ){
        valid.status = "success";
        valid.message = 'We cannot use Test.com as a domain name.';
      }
      else if ( !domain.match( domainRegex ) ){
          valid.status = "success";
          valid.message = '<code>' + domain + '</code> is not a valid domain name.';

          // If there is an '@', not valid
          if ( domain.indexOf('@') > -1 ){
            valid.status = "success";
            valid.message = 'We cannot accept this domain name because it contains an "@" sign.';
          }
          // If there is a space, not valid
          if ( domain.indexOf(' ') > -1 ){
            valid.status = "success";
            valid.message = 'We cannot accept this domain name because it contains spaces.';
          }
          // If there is a 'www', not valid
          else if ( domain.indexOf('www.') === 0 ){
            valid.status = "success";
            valid.message = 'We cannot accept this domain name because it contains "www.".';
          }
          // If there isn't a '.', not valid
          else if ( domain.indexOf('.') === -1 ){
            valid.status = "success";
            valid.message = 'We cannot accept this domain name because it lacks at least one period.';
          }
          else {
              // If there aren't at least two characters after the final '.', not valid
              var domainArray = domain.split('.');
              if ( domainArray[domainArray.length-1].length < 2 ){
                valid.status = "success";
                valid.message = 'We cannot accept this domain name because its extension has fewer than two characters. Valid extensions look like ".cc" or ".com" or ".info".';
              }
          }
      }
      return valid;
    break;

    case 'uri':
      var valid = validate('base', term ),
          uriRegex = /^((http|ftp|https):\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?$/,
          uri = valid.term;
      if ( uri.length > 0 ){
        if ( !uri.match( uriRegex ) ){
          valid.status = "success";
          valid.message = '<code>' + uri + '</code> is not a valid URL.';
        }
      } else if ( required === true ){
        valid.status = "success";
        valid.message = 'URL is required.';
      }
      return valid;
    break;

    case 'currency':
      var valid = validate('nonHtml',term,required);

      //strip whitespace
      valid.term = valid.term.replace(/[\s-]+/g, '');

      var regex = /(-?\d{1,3}(,?\d{3})*(\.\d{2}?))(\D|$)/;
      if ( valid.term.length > 0 ){
        if ( !valid.term.match( regex ) ){
          valid.status = "success";
          valid.message = '<code>' + valid.term + '</code> is not a valid currency amount';
        }
      } else if ( required === true ){
        valid.status = "danger";
        valid.message = 'Currency amount is required.';
      }
      return valid;
    break;

    case 'ccNumber':
      // Proposed allowed character list: numbers
      // Max length: 19
      // Min length: 14
      // See: http://www.freeformatter.com/credit-card-number-generator-validator.html
      var valid = validate.nonHtml( term ),
          regex = /^[1-9]\d{13,18}$/;
      if ( valid.status === "danger" ){
        valid.message = 'Credit card number cannot contain HTML.';
        return valid;
      }
      //strip whitespace
      valid.term = valid.term.replace(/[\s-]+/g, '');
      if ( valid.term.length > 0 ){
        if ( !valid.term.match( regex ) ){
          valid.status = "success";
          valid.message = '<code>' + valid.term + '</code> is not a valid credit card number';
        }
      } else if ( required === true ){
        valid.status = "success";
        valid.message = 'Credit card number is required.';
      }
      return valid;
    break;
    
    case 'cvcCode':
      // Proposed allowed character list: numbers
      // Max length: 4
      // Min length: 3
      var valid = validate.nonHtml( term ),
          regex = /^\d{3,4}$/;
      if ( valid.status === "danger" ){
        valid.message = 'CVC code cannot contain HTML.';
      }
      else if ( valid.term.length > 0 ){
        if ( !valid.term.match( regex ) ){
          valid.status = "success";
          valid.message = '<code>' + valid.term + '</code> is not a valid CVC number.';
        }
      }
      // can't be empty if required
      else if ( required === true ){
        valid.status = "success";
        valid.message = 'CVC code is required.';
      }
      return valid;
    break;

    case 'postBody':
      var valid = validate('base', term ),
          characterLimit = 420;
      if ( valid.term.length > characterLimit ){
        valid.status = "danger";
        valid.message = 'This message is too long, please shorten before sending';
      }
      // term isn't empty
      else if ( valid.term.length > 0 ){
        // check for html
        valid = validate.nonHtml( valid.term );
        if ( valid.status === "danger" ){
          // a more informative message then the plain nonHtml message
          valid.message = 'Your message cannot contain html.';
        }
      }
      // can't be empty if requried
      else if ( required === true ){
        valid.status = "danger";
        valid.message = 'Message cannot be empty.';
      }
      return valid;
    break;

    case 'tweetBody':
      var valid = validate('base', term.trim() ),
          characterLimit = 140; // see: https://dev.twitter.com/overview/api/counting-characters
      if ( valid.term.length > characterLimit ) {
        valid.status = "danger";
        valid.message = 'This message is too long, please shorten before sending';
      } else {
        valid = validate.postBody( valid.term, required );
      }
      return valid;
    break;

    case 'emailFromDisplay':
      var valid = validate('base', term ),
          emailFromRegex = /^(?:[a-zA-Z0-9!@#$%&'*\+\-\\=?^_`\{\|\}~\.,<> ])*$/;
      if ( valid.term.length > 0 ){
        if ( !valid.term.match( emailFromRegex ) ){
          valid.status = "success";
          valid.message = 'Your email form display name contains characters that aren\'t allowed.';
        }
      } else if ( required === true ){
        valid.status = "success";
        valid.message = 'Email from display name is required.';
      }
      return valid;
    break;

    case 'emailSubject':
      var valid = validate.nonHtml( term );
      if ( valid.status !== "sucess" ) {
        valid.message = 'Your email subject cannot contian HTML';
      }
      else if ( valid.term.length == 0 && required === true ){
        valid.status = "success";
        valid.message = 'Your email must have a subject.';
      }
      return valid;
    break;

    case 'emailBody':
      var valid = validate.visibleHtml(term,required);
      if ( valid.term.length == 0 && required === true ) {
        valid.status = "success";
        valid.message = 'Your email must have a body.';
      }
      return valid;
    break;

    case 'password':
      // Must be at least 8 characters, must have one uppercase letter, must have one number, must have one symbol
      var valid = validate('base', term ),
          // can validate the whole thing at once
          // passwordRegex = /(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*#?&]).{8,}$/,
          password = valid.term;
      // must be present if required
      if ( password.length == 0 ){
        if ( required === true ){
          valid.status = "success";
          valid.message = 'Password is required.';
        }
      }
      // must be at least 8 characters
      else if ( password.length < 8 ){
        valid.status = "success";
        valid.message = 'Your password is too short. It must be at least 8 characters.';
      }
      // check for required charactres
      else {
        if ( !password.match(/[A-Z]/) ){
          valid.status = "success";
          valid.message = 'Your password needs at least one uppercase letter.';
        }
        else if ( !password.match(/\d/) ){
          valid.status = "success";
          valid.message = 'Your password needs at least one number.';
        }
        else if ( !password.match(/[!@#$%^&*]/) ){
          valid.status = "success";
          valid.message = 'Your password needs at least one of the following: !, @, #, $, %, ^, &, *.';
        }
      }
      return valid;
    break;

  }

}

function validationMessaging($parent,type,message){

  // If the message is empty, forget about all of this
  if (!message) {
    return false;
  } else {

    // If $parent doesn't have a message container yet, create one
    if ( $('.status-messaging',$parent).length === 0 ){  
      $parent.prepend('<p class="alert status-messaging"></p>');
    }

    // Indentify and scrub message container
    var $alertWrap = $('.status-messaging',$parent);
        $alertWrap.removeClass('alert alert-info alert-danger alert-success alert-warning hidden').html(message);

    // Use the right display for various message types
    switch(type){
      case "danger":
      case "warning":
      case "success":
        $alertWrap.addClass('alert alert-'+type+' alert-dismissable').prepend('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
        $alertWrap.alert();
        break;
      default:
        $alertWrap.addClass('alert alert-info alert-dismissable').prepend('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
        $alertWrap.alert();
    }

    $alertWrap.removeClass('hidden');

    // If $parent isn't visible, make it visible
    if ( $parent.hasClass('hidden') ){
      $parent.removeClass('hidden');
    }

    // Scroll To message (if not visibile)
    if ( !isElementInViewport($alertWrap) ){
      var headerH = $('body > .navbar-default').height();
      $('html, body').animate({
          scrollTop: $alertWrap.offset().top-headerH-10
      },100);
    }

  }

}

function password_hint(){
  
    var password = $(this).val(),
        hint = '<span class="password-hint"><span class="uc-letter">Uppercase Letter <span class="check">âœ“</span></span><span class="number">Number <span class="check">âœ“</span></span><span class="special-char">Special Character <span class="check">âœ“</span></span><span class="length">Length 8+ <span class="check">âœ“</span></span></span>',
        $hint;
    // remove the hint if there is no password
    if ( password.length == 0 ){
      $(this).siblings('.password-hint').remove();
    }
    // add the hint if not added
    else if ( $(this).siblings('.password-hint').length == 0 ){
      $(this).after( hint );
    }
    $hint = $(this).siblings('.password-hint');
    // hide checkmarks
    $hint.find('.check').css('opacity', 0);
    $hint.find('.checked').removeClass('checked');
    // check the right things
    if ( password.match(/[A-Z]/) ){
      $hint.find('.uc-letter').addClass('checked').find('.check').css('opacity', 1);
    }
    if ( password.match(/\d/) ){
     $hint.find('.number').addClass('checked').find('.check').css('opacity', 1);
    }
    if ( password.match(/[!@#$%^&*]/) ){
      $hint.find('.special-char').addClass('checked').find('.check').css('opacity', 1);
    }
    if ( password.length >= 8 ){
      $hint.find('.length').addClass('checked').find('.check').css('opacity', 1);
    }
    function check( selector ){
      $hint.find( selector ).addClass('checked').find('.check').css('opacity', 1);
    }
};
jQuery.fn.extend( password_hint );

// Replaces commonly-used Windows 1252 encoded chars that do not exist in ASCII or ISO-8859-1 with ISO-8859-1 cognates.
var replaceWordChars = function(text) {
    var s = text;
    // smart single quotes and apostrophe
    s = s.replace(/[\u2018|\u2019|\u201A]/g, "\'");
    // smart double quotes
    s = s.replace(/[\u201C|\u201D|\u201E]/g, "\"");
    // ellipsis
    s = s.replace(/\u2026/g, "...");
    // dashes
    s = s.replace(/[\u2013|\u2014]/g, "-");
    // circumflex
    s = s.replace(/\u02C6/g, "^");
    // open angle bracket
    s = s.replace(/\u2039/g, "<");
    // close angle bracket
    s = s.replace(/\u203A/g, ">");
    // spaces
    s = s.replace(/[\u02DC|\u00A0]/g, " ");

    return s;
}
// end validate.js