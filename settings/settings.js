function loadSettings(){

  if ( !iOS ){
    $('.non-ios-messaging').removeClass('hidden');
  }

  /* Various states of backed-up-ness */

    if ( !localStorage.getItem('ipns_hash') && !localStorage.getItem('last_remote_backup') ){
      //$('#enableRemoteBackup').prepend(enableRemoteBackupHtml);
      $('#enableRemoteBackup').removeClass('hidden');
    }

    else if ( localStorage.getItem('ipns_hash') && !localStorage.getItem('last_remote_backup') ){
      var keepIpns = tl.assessRemoteBackup();
      if ( !keepIpns ){
        localStorage.removeItem('ipns_hash');
        //$('#enableRemoteBackup').prepend(enableRemoteBackupHtml);
        $('#enableRemoteBackup').removeClass('hidden');
      } else {
        //$('#enableRemoteBackup').prepend(enableRemoteBackupHtml);
        $('#enableRemoteBackup').removeClass('hidden');
      }
    }

    else {
      var viewRemoteBackupHtml = '<p class="alert alert-warning">Your data was last backed up '+moment(localStorage.getItem('last_remote_backup')).format("dddd, MMMM Do YYYY [at] h:mm:ss a")+'.</p>';
      $('#viewRemoteBackups').prepend(viewRemoteBackupHtml);
      $('#viewRemoteBackups').removeClass('hidden');
    }

  /*
    Various states of enabling remote backup are tracked via localStorage item 'enable_remote_backup':

    VALUE          INDICATES                                                   NEXT STOP
      undefined     not in workflow
      start         clicked "Enable Remote Backup" in Settings                  Billing
      shown         shown message about minimum payment in Billing
      success       successfully added minimum payment in Billing               Remote Backup
      restore       clicked "Restore from Backup" in Settings                   Remote Backup
      reencrypted   successfully updated keys in order to restore from backup   Remote Backup
  */

    $('#enableRemoteBackup .enable.btn').on('tap',function(){
      localStorage.setItem('enable_remote_backup','start');
    });

    $('#enableRemoteBackup .restore.btn').on('tap',function(){
      localStorage.setItem('enable_remote_backup','restore');
    });

  /* Export DB */

    $('.download-zip')
    .off(press)
    .on(press,function(e){
      e.preventDefault();
      exportDbToZip(tl,false); // Second argument is false because this is not part of a remote sync (see tallylab.js)
      return false;
    });

  /* Import Zip */

    $('#confirmImportDb .import-zip')
      .off(press)
      .on(press,function(e){
        e.preventDefault();
        importDb();
        return false;
      });

    $('#confirmImportDb').on('show.bs.modal',function(){
      //TODO clear file input
      $('#dbImportForm .status-messaging').remove();
      $('#confirmImportDb .initial').show();
      $('#confirmImportDb .resulting').hide();
    });

  /* Clean DB */

    $('.clean-db')
      .off(press)
      .on(press,function(e){
        e.preventDefault();

        var $button = $(this);

        // Start at the end
        document.addEventListener('cleanedDB',function(e){
          // RealFeel(tm)
          setTimeout(function(){
            $button.removeClass('loading');
            $('#confirmCleanDB').modal('hide');
          },500);
        });

        $button.addClass('loading');

        cleanDB();

        return false;
      });

  /* Reset TallyLab */

    $('#confirmDeleteTallyData .delete-tally-data')
      .off('tap')
      .on('tap',function(e){
        e.preventDefault();
        $(this).addClass('loading');
        deleteTallyData();
        return false;
      });

    $('#confirmResetTallyLab .reset-db')
      .off('tap')
      .on('tap',function(e){
        e.preventDefault();
        $(this).addClass('loading');
        resetTallyLab();
        return false;
      });

  document.removeEventListener('sync',loadSettings);
}

function importDb(){

  // Validate (gotta do this separately from validate.js cause of reasons)
  if ( $('#confirmImportTally input[type=file]').val() === "" ){
    validationMessaging($('#dbImportForm'),'danger','Gotta have a file, yo');
  } 

  // So we have an actual file...
  else {

    $('#dbImportForm .status-messaging').remove();

    var overrider = $('#confirmImportDb [name="overrider"]:checked').val();

    var $zipObj = $('#confirmImportDb input[type=file]');

    // Add status messaging upon each import
    document.addEventListener('ingestedCSV',function(e){

      if ( !e.detail.success ){

        $('#dbImportForm .status-messaging').append('<br />There was an error importing '+e.detail.file+': '+e.detail.error+' because '+e.detail.reason);

      } else {

        $('#dbImportForm .status-messaging').append('<br />Successfully imported '+e.detail.file); //TODO how to get filename from inside of this callback?

      }

    }, false);

    // File(s) is delivered as array, so we have to go through "each" even though we only anticipate having one in this case
    _.forEach($zipObj[0].files,function(file,i){
        
      importZip(file,overrider);

    }); // each zip file

    $('#confirmImportDb .initial').hide();
    $('#confirmImportDb .resulting').show();
  
  }

} // importDb

function deleteTallyData(){

  // Stop syncing
  clearInterval(setSyncInterval);

  // Clear data
  var tallyNum = tl.tallies.length;

  if ( tallyNum > 0 ){
    for ( var i = 0; i < tallyNum; i++) {
      tl.deleteTally(tl.tallies[0]);
      if ( tl.tallies.length === 0 ){
        tl.collections = [];
        tl.syncDb();
        // Arrakis shuffle
        setTimeout(function(){
          $('.delete-tally-data').removeClass('loading');
          location.href = '/app';
        },500);
      }
    }
  } else {
    tl.collections = [];
    tl.syncDb();
    // Arrakis shuffle
    setTimeout(function(){
      $('.delete-tally-data').removeClass('loading');
      location.href = '/app';
    },500);
  }

} // deleteTallyData

function resetTallyLab(){

  // Bye bye localStorage
  window.localStorage.clear();

  /* Bye Bye Database */

    // Stop syncing
    clearInterval(setSyncInterval);

    // Close Db
    var closeDb = dbengine.db.close();

    // Delete Db
    var delReq = window.indexedDB.deleteDatabase("TallyLab");

    delReq.onsuccess = function(){
      location.href = '/app';
    };

    delReq.onerror = function(){
      validationMessaging($('#confirmResetDb .modal-body'),"error","We encountered an error while deleting your TallyLab Database. Please try again.");
    };

    delReq.onblocked = function(){
      validationMessaging($('#confirmResetDb .modal-body'),"error","Resetting TallyLab is taking longer than expected. If your aren't redirected within one minute, please try again.");
    };

} // resetTallyLab

// end settings.js
