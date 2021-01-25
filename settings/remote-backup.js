function loadBackups(){

  // New backer-upper coming from BILLING
  // if ( localStorage.getItem('enable_remote_backup') === "success" ){

  //   document.addEventListener('ipns-hash-derived',async function(){
  //     tl.assessRemoteBackup(); // dispatches remote-backup-created
  //   });

  //   document.addEventListener('remote-backup-created',function(){

  //     // Last backup timestamp
  //     var lastBackupTime = moment(parseInt(localStorage.getItem('last_remote_backup'))).format("dddd, MMMM Do YYYY, h:mm:ss a");
  //     $('#gotBackups .last-backup').append(lastBackupTime + '. ');
  //     $('#gotBackups .last-backup').removeClass('hidden');

  //     // Toggle messaging
  //     $('#firstBackup').addClass('hidden');
  //     $('#gotBackups').removeClass('hidden');

  //     // We've reached the end of the enable remote backups flow
  //     localStorage.removeItem('enable_remote_backup');
  //   });

  //   // Establish identity
  //   tl.p2p.create_ipns_hash(); // dispatches ipns-hash-derived

  //   // Messaging about there not being any backups yet and they should wait on this page until there are
  //   $('#firstBackup').removeClass('hidden');
   
  // } // New backer-upper

  // Account-restorer coming from SETTINGS or SECURITY
  if ( localStorage.getItem('enable_remote_backup') === "restore" || localStorage.getItem('enable_remote_backup') === "reencrypted" ){

    document.addEventListener('ipns-name-derived',async function(){
        
        try {
          var backupContents = await tl.retrieveLatestBackup();
          var remote_tall = _.find(backupContents,function(o){ return o.path.indexOf('tallies') !== -1; });
        } catch(e) {
          console.log(e);
          var remote_tall = undefined;
        }

        if ( !remote_tall ){

          // Toggle Messaging
          $('#restoreAccount').addClass('hidden');
          $('#noSuchBackup').removeClass('hidden');

        } // invalid backup

        else {

          // Init restore button
          $('#confirmRestore .restore-to-backup').on('tap',function(e){
            tl.restoreFromLatestBackup(backupContents);
            localStorage.removeItem('enable_remote_backup');
          });

          // Toggle Messaging
          $('#restoreAccount').addClass('hidden');
          $('#gotBackups .last-backup').text('We found your most recent backup.');
          $('#gotBackups').removeClass('hidden');

        } // valid backup

    });

    document.addEventListener('ipns-name-notfound',function(){

      // Toggle Messaging
      $('#restoreAccount').addClass('hidden');
      $('#noSuchBackup').removeClass('hidden');

    });

    // Establish identity
    tl.p2p.derive_ipns_name(); // dispatches ipns-name-derived or ipns-name-notfound

    // Messaging about retrieving their last backup
    $('#restoreAccount').removeClass('hidden');

  } // Account-restorer

  // Curious backup-checker coming from SETTINGS
  else if ( localStorage.getItem('ipns_hash') && localStorage.getItem('last_remote_backup') ) {

    // Last backup timestamp
    var lastBackupTime = moment(parseInt(localStorage.getItem('last_remote_backup'))).format("dddd, MMMM Do YYYY, h:mm:ss a");
    $('#gotBackups .last-backup').text('We last backed up your account '+ lastBackupTime + '.');

    // Toggle messaging
    $('#backupNow,#gotBackups').removeClass('hidden');

    // Wire up restore button
    $('#confirmRestore .restore-to-backup').on('tap',async function(e){

        try {
          var backupContents = await tl.retrieveLatestBackup();
          var remote_tall = _.find(backupContents,function(o){ return o.path.indexOf('tallies') !== -1; });
        } catch(e) {
          console.log(e);
          var remote_tall = undefined;
        }

        if ( !remote_tall ){

          var pendingRemoteBackupHtml = '<p>Remote Backup is enabled and we are working on your first backup. Check back here in a few minutes.</p>';
          $('#gotBackups').html(pendingRemoteBackupHtml);
          $('#gotBackups').removeClass('hidden');

        } // invalid backup

        else {
          var now = moment().valueOf();
          localStorage.setItem('securityQreminder',now);
          tl.restoreFromLatestBackup(backupContents);
        }

    });

    $('#backupNow').on('tap',function(e){
      e.preventDefault();

      $button = $(this).addClass('loading');

      document.addEventListener('remote-backup-created',function(){

        $button.removeClass('loading');

        var lastBackupTime = moment(parseInt(localStorage.getItem('last_remote_backup'))).format("dddd, MMMM Do YYYY, h:mm:ss a");

        $('#gotBackups .last-backup').text('We last backed up your account '+ lastBackupTime + '.');

      });

      tl.createRemoteBackup();

      return false;
    }); // Backup now

  } // Backup-checker

  // Mystery visitor with an ipns_hash but no backup, and not part of our established workflows above
  else if ( localStorage.getItem('ipns_hash') && !localStorage.getItem('last_remote_backup') ){

    (async function(){

      // Look for a backup
      try {
        var backupContents = await tl.retrieveLatestBackup();
        var remote_tall = _.find(backupContents,function(o){ return o.path.indexOf('tallies') !== -1; });
      } catch(e) {
        console.log(e);
        var remote_tall = undefined;
      }

      if ( !remote_tall ){

        var keepIpns = tl.assessRemoteBackup();

        if ( !keepIpns ){

          localStorage.removeItem('ipns_hash');

        } else {

          // Toggle Messaging
          var pendingRemoteBackupHtml = '<p>We are working on your first backup. Check back here in a few minutes.</p>';
          $('#gotBackups').html(pendingRemoteBackupHtml);
          $('#gotBackups').removeClass('hidden');

        }

      } // invalid backup

      else {

        // Init restore button
        $('#confirmRestore .restore-to-backup').on('tap',function(e){
          tl.restoreFromLatestBackup(backupContents);
          localStorage.removeItem('enable_remote_backup');
        });

        // Toggle Messaging
        $('#gotBackups .last-backup').html('We found your most recent backup. ');
        $('#gotBackups .last-backup').removeClass('hidden');
        $('#gotBackups').removeClass('hidden');

      } // valid backup

    });

  } // Mystery IPNS-haver

  // Mystery visitor coming from ????? – unclear how a user would get to this page other than through the above scenarios
  else {

    $('#mysteryVisitor').removeClass('hidden');

  } // Mystery visitor

  document.removeEventListener('sync',loadBackups);
}
