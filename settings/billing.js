$('#billingCycle,#billingAmount').on('change keyup blur',function(){
  validateBillingForm($(this));
  //tierMessaging($('#billingCycle option:selected').val().toLowerCase(),$('#billingAmount').val().toLowerCase());
});

var stripeHandler = StripeCheckout.configure({
  key: 'pk_test_iyEw2JNInlQLzjLKhYrHDqSq',
  locale: 'auto',
  name: 'TallyLab Supporter',
  token: function(token) {
    var verification = tl.encryption.encrypt(Math.random().toString(36).substring(7));
    $('input#stripeToken').val(token.id);
    $("input#verification").val(verification);
    $('input#customerEmail').val(token.email);
    $('#billingForm').submit();
  }
});

$('#stripeSubmit').on('click',function(e){
  e.preventDefault();
  var valid = validateBillingForm($('#billingCycle,#billingAmount'));
  //var meetsReqs = tierMessaging($('#billingCycle option:selected').val().toLowerCase(),$('#billingAmount').val().toLowerCase());
  if ( valid.status === "success" ){
    //if ( meetsReqs ){ localStorage.setItem('enable_remote_backup','success'); }
    stripeHandler.open({
      description: $('#billingCycle option:selected').val(),
      amount: $('#billingAmount').val()*100
    });
  }
  return false;
});

window.addEventListener('popstate', function() {
  stripeHandler.close();
});

function validateBillingForm(which){

  var allVal = { status: "success" };

  which.each(function(){

    var $it = $(this);

    var valid = validate($it.data('validationType'),$it.val(),$it.data('required'));

    if ( valid.status !== "success" ){

      $it.addClass('has-error');
      validationMessaging($it.closest('.form-group'),valid.status,valid.message);
      $it.closest('form').find('[type=submit]').prop('disabled',true);

      allVal.status = "danger";

    } else if ( allVal.status === "success" ) {

      $it.removeClass('has-error');
      $it.closest('form').find('.status-messaging').remove();
      $it.closest('form').find('[type=submit]').attr('disabled',false);

    }

  });

  return allVal;

}

function loadBilling(){

  // Lotta ifs! These are in a precise order so think hard before reordering them.

  // If user is just returning from the Stripe workflow, add their customer id and payment_provider to localStorage, then refresh
  var customer_id_from_url = URLParser(window.location.toString()).getParam('customer_id');
  if(typeof customer_id_from_url !== "undefined") {
    localStorage.setItem("stripe.customer_id", tl.encryption.encrypt(customer_id_from_url));
    localStorage.setItem("payment_provider","Stripe");
    if ( localStorage.getItem('enable_remote_backup') === "success" ){
      window.location = "/app/settings/remote-backup.html";
    } else {
      window.location = "/app/settings/billing.html";
    }
  }

  // If user is coming from enable remote backup, show special message
  if ( localStorage.getItem('enable_remote_backup') === "start" ){
    $('#billingIntro').before('<div class="alert alert-warning">'+enableRemoteBackupHtml+'</div>');
    localStorage.setItem('enable_remote_backup',"shown");
  }

  // If user has payment provider specified, but their id has been deleted, we got probs
  if ( !localStorage.getItem("stripe.customer_id") && localStorage.getItem("payment_provider") === "Stripe" ) {
    $('#billing').addClass('stripe-error');
    $('#billingIntro').before('<p class="alert alert-warning">We are unable to verify your billing history. Please <a href="mailto:info@tallylab.com" target="_blank" style="text-decoration:underline">contact us</a>.</p>');
  }

  // Otherwise, if user is existing customer...
  else if ( localStorage.getItem("stripe.customer_id") ) {

    // Make sure they have payment provider specified, since we weren't always doing this
    localStorage.setItem("payment_provider","Stripe");

    // Try to decrypt their customer id
    var customer_id_from_localstorage = tl.encryption.decrypt(localStorage.getItem("stripe.customer_id"));

    // If we can't even decrypt their ID, show message and delete id
    if ( !customer_id_from_localstorage ){
      localStorage.removeItem("stripe.customer_id");
      $('#billing').addClass('stripe-error');
      $('#billingIntro').before('<p class="alert alert-warning">We have no billing history on file for you. If you believe that is an error, <a href="mailto:info@tallylab.com" target="_blank" style="text-decoration:underline">contact us</a>.</p>');
      return false;
    }

    fetch("https://us-east-2a.ipfs.tallylab.com/payment_history/" + customer_id_from_localstorage + "?bartleby=michael")
      .then(function(res){ return res.json(); })
      .then(function(customer) {

        // If they have no verification metadata, or we can't decrypt it, show message and delete id
        if( !customer.verification || !tl.encryption.decrypt(customer.verification) ){
          localStorage.removeItem("stripe.customer_id");
          $('#billing').addClass('stripe-error');
          $('#billingIntro').before('<p class="alert alert-warning">We have no billing history on file for you. If you believe that is an error, <a href="mailto:info@tallylab.com" target="_blank" style="text-decoration:underline">contact us</a>.</p>');
          return false;
        }

        else {

          var paymentProvider = "Stripe"; // Will be variable later
          var payAmount = (customer.billingAmount/100).toFixed(2), payText, payTime, payInterval, intervalText, updateText, cancelText, responseText;
          var planCreated = customer.planCreated * 1000;

          switch(customer.billingInterval){

            case "month":

              payTime = moment(planCreated).format('Do');
              responseText = '<p class="alert alert-warning"><strong>Thank you!</strong> You are currently paying us $'+payAmount+' on the '+payTime+' of every month via '+paymentProvider+'. To update your payment, use the form below. To cancel your payment, <a id="cancelPayment" data-toggle="modal" href="#confirmCancelPayment" style="text-decoration:underline">click here</a>.</p>';

              break;

            case "year":

              payTime = moment(planCreated).format('MMMM Do');
              responseText = '<p class="alert alert-warning"><strong>Thank you!</strong> You are currently paying us $'+payAmount+' yearly on '+payTime+' via '+paymentProvider+'. To update your payment, use the form below. To cancel your payment, <a id="cancelPayment" data-toggle="modal" href="#confirmCancelPayment" style="text-decoration:underline">click here</a>.</p>';

              break;

            default:

              if(customer.orders.length === 0) { break; }
              var firstOrder = customer.orders[0];

              payTime = moment(firstOrder.date * 1000).format('l');
              responseText = '<p class="alert alert-warning"><strong>Thank you!</strong> You paid us $'+(firstOrder.amount / 100)+' on '+payTime+' via '+ paymentProvider +'. To make another payment, use the form below.</p>';

              break;

          }

          $('#billingIntro').before(responseText);

        } // Valid customer

      }); // second fetch promise
  } // existing customer

  $('#cancelPayment').on('click',function(e){
    fetch("https://us-east-2a.ipfs.tallylab.com/cancel_stripe_payment/" + customer_id_from_localstorage + "?bartleby=michael",{ method: 'POST' })
      .then(function(res){ return res.json(); })
      .then(function(data){ window.location.reload(); });
  });

  $('#resetStripeId button').on('tap',function(e){
    e.preventDefault();

    var valid = validateResetStripeIdForm();
    if ( valid.status === "success" ){
      updateStripeId(valid.term);
      window.location = "/app/settings/billing.html";
    }

    return false;
  });

  $('#pageLoaderContainer,#TLsettings').toggleClass('hidden');

  document.removeEventListener('sync',loadBilling);
} // loadBilling

$('#nuStripeId').on('blur',function(){
  validateResetStripeIdForm($(this));
});

function validateResetStripeIdForm(){

  var $it = $('#nuStripeId');

  var valid = validate($it.data('validationType'),$it.val(),$it.data('required'));

  if ( valid.status !== "success" ){

    $it.addClass('has-error');
    validationMessaging($it.closest('.form-group'),valid.status,valid.message);
    $(this).prop('disabled',true);

  } else {

    $it.removeClass('has-error');
    $it.closest('form').find('.status-messaging').remove();
    $(this).attr('disabled',false);

  }

  return valid;
}

function updateStripeId(stripeId){
  localStorage.setItem('stripe.customer_id',tl.encryption.encrypt("cus_"+stripeId));
  localStorage.setItem("payment_provider","Stripe"); // just to make sure
}

// end of billing.js
