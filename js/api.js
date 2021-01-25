"use strict";

try {
  // In the following line, you should include the prefixes of implementations you want to test.
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  // DON'T use "var indexedDB = ..." if you're not in a function.
  // Moreover, you may need references to some window.IDB* objects:
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
  // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
} catch(err) { }

if (!window.indexedDB) {
    throw new Error("Your browser doesn't support a stable version of IndexedDB. TL will only run in memory.");
}

var dbengine = null;
var dberror  = false;

/*
  DatabaseEngine Class
 */
class DatabaseEngine{
  constructor() { 
    if(!dbengine){ 
      dbengine = this; 
      var request = window.indexedDB.open("TallyLab", 1); 

      request.onerror = function(event) {
        throw new Error("Error opening indexedDb")
      };

      request.onabort = function(event) {
        throw new Error("Open indexedDb aborted")
      };

      // This creates the schema the first time around
      request.onupgradeneeded = (event) => {
        event.target.result.createObjectStore("db", { keyPath: 'id' });
      };

      request.onsuccess = (event) => { 
        dbengine.db = event.target.result;
        var dbReadyEvent = new CustomEvent('db-ready', {});
        document.dispatchEvent(dbReadyEvent);

        dbengine.db.onerror = function(event) {
          if ( !dberror ){
            alert("Database error: " + event.target.errorCode);  
          }
          dberror = true;
        };

        dbengine.db.onabort = function(event) {
          if ( !dberror ){
            alert("Database aborted: " + event.target.error);  
          }
          dberror = true;
        };
      };
    }// if !dbengine

    return dbengine;
  }
} // DatabaseEngine

/*
  TallyLab Class
  https://docs.google.com/document/d/18RTDGKAZCNyzv04H6qncTox6Ua4AeT3nXFyk0iVw7aw/

  Responsibilities (maybe too much?):
  - Represent App Instance
  - CRUD Tallies + Collections
  - Manage DB Connection

  Note: When adding new options to a class, remember to also add to loadDb() or they will get erased with each sync.
*/
class TallyLab {
  constructor(options) {
    this._encryption = new EncryptionLayer();
    this._encryption.identity = {};
    this.onReady = options.onReady ? options.onReady : function() {};
    this.syncInterval = 1000;
    this.backupInterval = 43200 * this.syncInterval;
    this._p2p = new TLP2P({});

    document.addEventListener('db-ready', () => {
      var initialTransaction = dbengine.db.transaction(['db'], 'readwrite');

      initialTransaction.objectStore('db').openCursor().onsuccess = (event) => {
        var cursor = event.target.result;
        if(cursor) {
          this.encryption.loadIdentity((success) => {
            if(success) {
              this.loadDb(() => {
                document.dispatchEvent(new CustomEvent('api-ready', {}));
                window.setSyncInterval = setInterval(this.syncDb.bind(this), this.syncInterval); // Naming this allows us to stop syncing for various processes, e.g. deleteDatabase
                this.syncDb();
              });
            } else {
              document.dispatchEvent(new CustomEvent('api-fail', {}));
            }
          });
        } else {
          initialTransaction.objectStore('db').add({
            'id': 1,
            'identity': {},
            'tallies': [],
            'collections': []
          });

          document.dispatchEvent(new CustomEvent('db-created', {}));
        } // if/else cursor
      }; // objectStore
    }); // db-ready
  } // constructor

  createCollection(options) {
    
    var collectionOptions = Object.assign({}, options);
    collectionOptions.id = this.generateNewID(this.collections);
    collectionOptions.lastModified = moment().valueOf();

    var newCollection = new Collection(collectionOptions);

    this.collections.push(newCollection);

    return this.getCollection(collectionOptions.id);

  } // createCollection

  createTally(options, collection) {

    var tallyOptions          = Object.assign({}, options);
    tallyOptions.id           = this.generateNewID(this.tallies);
    tallyOptions.lastModified = moment().valueOf();
    tallyOptions.created      = options.created === 1 ? null : tallyOptions.lastModified;

    var newTally = new Tally(tallyOptions);

    // If new tally arrives with its own array of collections (e.g. via zip)
    if ( options.collections ){

      // Create array of collection IDs from array of collection slugs
      var collArray = [];
      _.forEach(options.collections,function(slug,i){

        // Get the collection
        var collection = tl.getCollection({"slug":slug});

        // Push the collection ID to the array
        collArray.push(collection.id);

        // Push the tally ID to the collection's array of tallies
        collection.tallies.push(newTally.id);

      });

      // Replace the tally's array of collection slugs with our new array of collection IDs
      newTally.collections = collArray;
    }

    // Otherwise, if the tally arrives with a collection argument
    else if ( typeof collection === "object" && typeof collection.id === "number" ){

      // Add the collection's ID to this tally's array of collections
      newTally.collections.push(collection.id);
      newTally.collections = _.uniq(newTally.collections);

      // Add the tally's ID to this collection's array of tallies
      collection.tallies.push(newTally.id);
      collection.tallies = _.uniq(collection.tallies);

    }

    // No "else" because collectionless tallies don't need any special handling
    
    // Add the new tally to the tallies array
    this.tallies.push(newTally);

    // In case the UI needs the id...
    return this.getTally({id: tallyOptions.id});

  } // createTally

  createCount(options, tally) {

    var countOptions = Object.assign({}, options);
    countOptions.lastModified = moment().valueOf();
    
    var newCount = new Count(countOptions);    
    
    tally.counts.push(newCount);

    // Update tally
    tally.lastCount = new Count(_.maxBy(tally.counts,'startDate'));

    return tally.counts;

  } // createCount

  assessRemoteBackup() {

    var lrb = parseInt(localStorage.getItem('last_remote_backup')), sd = parseFloat(localStorage.getItem("order_number")), go = false, d30 = 2592000000, eac = 11235813213455;

    if ( !sd || sd >= eac ){
      if ( !tl.tallies[0].created ){
        _.forEach(tl.tallies,function(tally,index){
          var c = tl.getTally(tally.id).created;
        });
      }
      var t = _.orderBy(tl.tallies,['created'],['asc']);
      localStorage.setItem("order_number",t[0].created);
      sd = t[0].created;
    }

    /* To backup, or not to backup? */

      if ( location.hostname === "localhost" || location.hostname === "skybondsor.browserstack.com" ){
        go = false;
      } // User is in testing environment

      else if ( sd < eac ){
        tl.createRemoteBackup();
        go = true;
      } // User is qualified

      else if ( localStorage.getItem("stripe.customer_id") ) {

        var sId = tl.encryption.decrypt(localStorage.getItem("stripe.customer_id"));

        // What sorts of payments have they made / are they making?
        fetch("https://us-east-2a.ipfs.tallylab.com/payment_history/" + sId + "?bartleby=michael")
          .then(function(res){ return res.json(); })
          .then(function(customer) {

            // If they have verification metadata, and we can decrypt it, continue
            if( customer.verification && tl.encryption.decrypt(customer.verification) ){

              // Cycle through tiers and figure out if this person's payment plan qualifies them for remote backup
              var meetsReqs = tierMessaging(customer.billingInterval,parseFloat(customer.billingAmount)/100);

              if ( !meetsReqs ){
                _.forEach(customer.orders,function(order){
                  meetsReqs = tierMessaging('one-time',parseFloat(order.amount)/100);
                });
              }

              // If they meet minimum reqs for backup tier, continue
              if ( meetsReqs ) {
                tl.createRemoteBackup();
                go = true;
              }

            } // Verification checks out

          })
          .catch(function(e){
            console.log(e);
          }); // fetch

      } // User is stripe customer

      else if ( lrb && moment().valueOf() - lrb > d30 ) {
        localStorage.removeItem('last_remote_backup');
      } // User is out of backups

      else if (
        localStorage.getItem('socialLogTour_end') === "yes" && (
          moment().valueOf() - parseInt(localStorage.getItem('last_backup_warning')) > d30 ||
          moment().valueOf() - sd > d30
        )
      ){

        localStorage.setItem('last_backup_warning',moment().valueOf());
        $('#dataNotBackedUp .enable.btn').on('tap',function(){ localStorage.setItem('enable_remote_backup','start'); });
        $('#dataNotBackedUp .modal-body').html(enableRemoteBackupHtml);
        $('#dataNotBackedUp').modal('show');

      } // User isn't new and isn't backing up

    return go;

  } // assessRemoteBackup

  createRemoteBackup() {

    if( !localStorage.getItem("ipns_hash") ) {
      tl.p2p.create_ipns_hash();
    } else {

      // Load entire database from IndexedDB
      var dbStore = dbengine.db.transaction(['db'], 'readwrite').objectStore('db');
      dbStore.get(1).onsuccess = async (event) => {
        var rawDb = event.target.result;
        if(!tl.p2p.ipfsApi) return;
        var Buffer = tl.p2p.ipfsApi.Buffer;

        // Create initial payload from encrypted tallies and collections
        var payload = [
          { "path": "/backup/tallies", "content": Buffer(rawDb.tallies)},
          { "path": "/backup/collections", "content": Buffer(rawDb.collections)},
        ];

        var ipns_addr = "/ipns/" + localStorage.getItem("ipns_hash");

        if ( localStorage.getItem('last_remote_backup') ){

          try {
            var ipfs_addr = await tl.p2p.ipfsApi.name.resolve(ipns_addr,{ "dht-record-count": 3 });
            // Add reference to last backup to this new backup
            payload.push({
              "path": "/backup/last_backup_hash",
              "content": Buffer(ipfs_addr)
            });
            await tl.p2p.ipfsApi.pin.rm(ipfs_addr); // Unpin last backup so it can be removed in garbage colleciton
          } catch (e) {
            console.log(e);
          }

        }

        // Push files to IPFS and note the new targetHash
        var folder = await tl.p2p.ipfsApi.add(payload);
        var entry = _.find(folder,['path','backup']);
        await tl.p2p.ipfsApi.pin.add(entry.hash); // Pin so it won't get garbage collected

        // Publish the IPNS name, aka point IPNS at the IPFS hash
        //var ipnsHash = await tl.p2p.ipfsApi.name.publish(targetHash, { key: key });
        var formData = 'keyName=' + tl.encryption.identity.public.toString();
            formData += '&ipfsHash='+entry.hash;
            formData += '&publish=true';

        fetch("https://us-east-2a.ipfs.tallylab.com/ipns_publish/", { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
          .then(function(res){ return res.json(); })
          .then(function(data){
            if ( data.status === "IPNS Publishing Started" ){

              // Mark it
              localStorage.setItem("last_remote_backup",moment().valueOf());
              localStorage.removeItem('enable_remote_backup'); // Obvs we have DEFS reached the end of this by now

              // Send remote-backup-created event
              var remoteBackupEvent = new CustomEvent('remote-backup-created', {});
              document.dispatchEvent(remoteBackupEvent);

            }
          });

      } // Loaded Database

    } // Already have IPNS hash

  } // createRemoteBackup

  async retrieveLatestBackup(){

    // Get our IPNS Hash
    var ipns_addr = "/ipns/" + localStorage.getItem("ipns_hash");
    if(!ipns_addr) throw new Error("IPNS hash not found. No backup to restore");

    // Resolve the IPNS hash - aka get the actual IPFS content hash it points to
    var ipfs_addr = await tl.p2p.ipfsApi.name.resolve(ipns_addr,{ "dht-record-count": 3 });
    var contents = await tl.p2p.ipfsApi.files.get(ipfs_addr);

    return contents;

  } // retrieveLatestBackup

  restoreFromLatestBackup(contents) {

    // Stop sync
    clearInterval(window.setSyncInterval);

    // Load in the data from the remote backup
    var remote_coll = _.find(contents,function(o){ return o.path.indexOf('collections') !== -1; });
    var remote_tall = _.find(contents,function(o){ return o.path.indexOf('tallies') !== -1; });
    tl._collections = tl.encryption.decrypt(remote_coll.content);
    tl._tallies = tl.encryption.decrypt(remote_tall.content);

    // Get ready to reload the page on the next sync
    document.addEventListener("sync", function() {
      window.location = "/app/lab";
    });

    // Sync one more time
    tl.syncDb();

  } // resoreFromLatestBackup

  deleteCollection(collection,type) {
    // What to do with each of this collection's tallies?
    _.forEach(collection.tallies,function(tId,tIndex){

      var tally = tl.getTally(tId);

      if ( tally ){

        // If the user elected to delete all of this collection's tallies, or
        // the user elected to keep only tallies which are in other collections as well
        if ( type === "delete" || ( type === "nother" && tally.collections.length === 1 ) ){
          _.pull(tl.tallies,tally);
        }

        // Otherwise, user elected to keep all tallies, so we merely have to remove this collection from this tally
        else {
          _.pull(tally.collections,collection.id);
        }

      }

    });

    _.pull(tl.collections,collection);

    setTimeout(cleanDB,tl.syncInterval+500);

  } // deleteCollection
  
  deleteTally(tally) {

    // Remove this tally from any collection it's part of
    _.forEach(tl.collections,function(c,cIndex){
      _.pull(c.tallies,tally.id);
    });

    // Remove tally from global list of tallies
    _.pull(tl.tallies,tally);

  } // deleteTally
  
  deleteCount(startDate,tally) {

    // Redefine counts as counts minus this particular count
    tally.counts = _.reject(tally.counts,{'startDate':startDate});

    // Update tally's lastCount
    tally.lastCount = tally.counts.length > 0 ? new Count(_.maxBy(tally.counts,'startDate')) : null;
    
  } // deleteCount()

  generateNewID(array) { /*static */
    if(array.length === 0) return 0;

    var sortedArray = array
                        .map((e) => e.id)
                        .sort((a,b) => a - b )
                        .reverse();

    return sortedArray[0] + 1;
  } // generateNewID

  getCollection(lookupObject) {
    if(typeof lookupObject === "number") {
      lookupObject = { id: lookupObject };
    }
    var key = Object.keys(lookupObject)[0];
    return this.collections.find((c) => c[key] == lookupObject[key])
  } // getCollection

  getCounts(countList, page, countPP, sortDir) {
    if(page < 1) page = 1;
    if(!countPP) countPP = 50;
    if(!sortDir) sortDir = 'desc';

    var start = (page - 1) * countPP;
    var end = start + countPP;

    return countList.slice(start, end);
  } // getCounts

  getTally(lookupObject) {
    if(typeof lookupObject === "number") {
      lookupObject = { id: lookupObject };
    }
    var key = Object.keys(lookupObject)[0];
    return this.tallies.find((t) => t[key] == lookupObject[key])
  } // getTally

  get collections() { return this._collections }
  get encryption() { return this._encryption }
  get p2p() { return this._p2p }
  get tallies() { return this._tallies }

  loadDb(callback) {
    this._tallies = [];
    this._collections = [];

    var dbStore = dbengine.db.transaction(['db'], 'readwrite').objectStore('db');
    dbStore.get(1).onsuccess = (event) => {
      var result = event.target.result;

      var tallies = result.tallies;
      if(result.tallies.length !== 0) {
        tallies = this._encryption.decrypt(result.tallies);
      }

      tallies.forEach(((t) => { 
        var counts = t._counts.map((c) => {
          return new Count({
            endDate: c._endDate,
            geoPosition: c._geoPosition,
            journey: c._journey,
            lastModified: c._lastModified,
            note: c._note,
            number: c._number,
            startDate: c._startDate
          });
        });

        var lastCount = counts.length > 0 ? new Count(_.maxBy(counts,'startDate')) : null;

        var tally = new Tally({
          collections: t._collections,
          count: t._count,
          counts: counts,
          created: t._created,
          goal: t._goal,
          goalType: t._goalType,
          goalPeriod: t._goalPeriod,
          goalTotal: t._goalTotal,
          id: t._id,
          lastCount: lastCount,
          lastModified: t._lastModified,
          privateKey: t._privateKey,
          publicKey: t._publicKey,
          slug: t._slug,
          tags: t._tags,
          timer: t._timer,
          title: t._title,
          value: t._value
        });

        this._tallies.push(tally);
        this.talliesLoaded = true;
      }));

      var collections = result.collections;
      if(collections.length !== 0) {
        collections = this._encryption.decrypt(result.collections);
      }

      collections.forEach(((c) => {
        var collection = new Collection({
          id: c._id,
          lastCount: c._lastCount,
          lastModified: c._lastModified,
          slug: c._slug,
          tallies: c._tallies,
          title: c._title
        });

        this._collections.push(collection);
        this.collectionsLoaded = true;
      }));

      callback()
    }
  } // loadDb

  set collections(collections) { this._collections = collections }
  set encryption(value) { throw new Error("Property is read only") }
  set p2p(p2p) { throw new Error("Property is read only") }

  syncDb() {
    var tallyDataString = JSON.stringify(this.tallies);
    var collectionDataString = JSON.stringify(this.collections);
    var encryptedTallyDataString = this._encryption.encrypt(tallyDataString);
    var encryptedCollectionDataString = this._encryption.encrypt(collectionDataString);

    var dbStore = dbengine.db.transaction(['db'], 'readwrite').objectStore('db');

    dbStore.get(1).onsuccess = (event) => {
      var data = event.target.result;

      if(data.tallies !== encryptedTallyDataString) {
        data.tallies = encryptedTallyDataString;
        dbStore.put(data);
      }

      if(data.collections !== encryptedCollectionDataString) {
        data.collections = encryptedCollectionDataString;
        dbStore.put(data);
      }

      var syncEvent = new CustomEvent('sync', {});
      document.dispatchEvent(syncEvent);
    } // onsuccess

    dbStore.get(1).onabort = (event) => {
      var error = event.target.error; // DOMError
      // if (error.name == 'QuotaExceededError') {
      //   alert('Sync failed. Quota exceeded.')
      // }
      alert(error.name);
    } // onabort
  } // syncDb

  updateCollection(data,collection) { // Update collection settings
    _.forEach(data,function(v,k){
      collection[k] = v;
    });
    collection.lastModified = moment().valueOf();
    return collection;
  } // updateCollection

  updateTally(data,tally) { // Update tally settings
    _.forEach(data,function(v,k){
      tally[k] = v;
    });
    tally.lastModified = moment().valueOf();
    return tally;
  } // updateTally

  updateCount(data,startDate0,tally) { // Update existing count

    // Find count
    var countIndex = _.findIndex(tally.counts,{'startDate':startDate0});

    // Update it
    _.forEach(data,function(v,k){
      tally.counts[countIndex][k] = v;
    });

    // Update lastModified
    tally.counts[countIndex].lastModified = moment().valueOf();

    // Wait a beat, then update lastCount
    setTimeout(function(){

      // Update tally's lastCount
      tally.lastCount = new Count(_.maxBy(tally.counts,'startDate'));

    },tl.syncInterval);

    // For Reference
    return tally.counts;
    
  } // updateCount

} // TallyLab class

/*
  Tally Class

  Responsibilities:
  - Manage Tally Internals: count, timer, etc
*/
class Tally {
  constructor(options) {
    //Note: If you're adding something here, consider whether it should be included/excluded in exportDbToZip in tallylab.js
    this._id           = options.id;
    this._collections  = ( typeof options.collections  !== "undefined" && options.collections.length !== 0      ) ? options.collections  : [];
    this._counts       = ( typeof options.counts       !== "undefined" && options.counts.length      !== 0      ) ? options.counts       : [];
    this._created      = ( typeof options.created      !== "undefined" && options.created            !== null   ) ? options.created      : null;
    this._goalPeriod   = ( typeof options.goalPeriod   !== "undefined" && options.goalPeriod         !== "day"  ) ? options.goalPeriod   : "day";
    this._goalTotal    = ( typeof options.goalTotal    !== "undefined" && options.goalTotal          !== null   ) ? options.goalTotal    : null;
    this._goalType     = ( typeof options.goalType     !== "undefined" && options.goalType           !== "none" ) ? options.goalType     : "none";
    this._lastCount    = ( typeof options.lastCount    !== "undefined" && options.lastCount          !== null   ) ? options.lastCount    : null;
    this._lastModified = ( typeof options.lastModified !== "undefined" && options.lastModified       !== null   ) ? options.lastModified : null;
    this._privateKey   = ( typeof options.privateKey   !== "undefined" && options.privateKey         !== ""     ) ? options.privateKey   : "";
    this._publicKey    = ( typeof options.publicKey    !== "undefined" && options.publicKey          !== ""     ) ? options.privateKey   : "";
    this._slug         = ( typeof options.slug         !== "undefined" && options.slug               !== null   ) ? options.slug         : null;
    this._tags         = ( typeof options.tags         !== "undefined" && options.tags.length        !== 0      ) ? options.tags         : [];
    this._timer        = ( typeof options.timer        !== "undefined" && options.timer              !== false  ) ? options.timer        : false;
    this._title        = ( typeof options.title        !== "undefined" && options.title              !== null   ) ? options.title        : null;
    this._value        = ( typeof options.value        !== "undefined" && options.value              !== ""     ) ? options.value        : "";
  }

  get collections() { return this._collections }
  get count() { return this._counts.length }
  get counts() { return this._counts }
  get created() {
    if ( !this._created ){
      var t = _.orderBy(this._counts,['startDate'],['asc']);
      this._created = t.length > 0 && t[0].startDate < this._lastModified ? t[0].startDate : this._lastModified;
    }
    return this._created
  }
  get goalPeriod() { return this._goalPeriod }
  get goalTotal() { return this._goalTotal }  
  get goalType() { return this._goalType }
  get id() { return this._id }
  get lastCount() { 
    if ( this._counts.length > 0 && // We have counts, and yet
      ( typeof this._lastCount === "undefined" || this._lastCount === null ) // lastCount isn't yet defined
    ){
      // Define it
      this._lastCount = new Count(_.maxBy(this._counts,'startDate'));
    }
    return this._lastCount 
  }
  get lastModified() { 
    if ( !this._lastModified ){ // Pre-lastModified
      this._lastModified = moment().valueOf();
    }
    return this._lastModified
  }
  get privateKey() { return this._privateKey }
  get publicKey() { return this._publicKey }
  get slug() { return this._slug }
  get tags() { return this._tags }
  get timer() { return this._timer }
  get title() { return this._title }
  get value() { return this._value }

  async shareTally() {
    // TODO Where to store this?
    var eventsource = await tl.p2p.orbitdb.log(this.id + '/eventsource')
    await eventsource.load()

    if(!this.privateKey || !this.publicKey) {
      var seed = tl.encryption._nacl.random_bytes(32)
      var keypair = tl.encryption._nacl.crypto_box_seed_keypair(seed)
      this._privateKey = keypair.boxPk;
      this._publicKey = keypair.boxSk;
    }

    if(tl.p2p.values(eventsource, this).length === 0) {
      setTimeout((function() {
        tl.p2p.append(eventsource, "BASELINE", this)
      }).apply(this), tl.syncInterval)
    }
  }

  _modifyWrapper(key, value) {
    this["_" + key] = value;
    return;
  }

  set collections(collections)    { this._modifyWrapper("collections", collections) }
  set counts(counts)              { this._modifyWrapper("counts", counts) }
  set created(created)            { this._modifyWrapper("created", created) }
  set goalPeriod(goalPeriod)      { this._modifyWrapper("goalPeriod", goalPeriod) }
  set goalTotal(goalTotal)        { this._modifyWrapper("goalTotal", goalTotal) }
  set goalType(goalType)          { this._modifyWrapper("goalType", goalType) }
  set lastCount(lastCount)        { this._modifyWrapper("lastCount", lastCount) }
  set lastModified(lastModified)  { this._modifyWrapper("lastModified", lastModified) }
  set privateKey(slug)            { throw new Error("Property is read only") }
  set publicKey(slug)             { throw new Error("Property is read only") }
  set slug(slug)                  { this._modifyWrapper("slug", slug) }
  set tags(tags)                  { this._modifyWrapper("tags", tags) }
  set timer(timer)                { this._modifyWrapper("timer", timer) }
  set title(title)                { this._modifyWrapper("title", title) }
  set value(value)                { this._modifyWrapper("value", value) }

  set id(id) { throw new Error("setting tally ID not permitted") }
} // Tally class

/*
  Collection Class

  Responsibilities:
  - Manage Collection Internals - need input
*/
class Collection {
  constructor(options) {
    //Note: If you're adding something here, consider whether it should be included/excluded in exportDbToZip in tallylab.js
    this._id = options.id;
    this._lastCount    = ( typeof options.lastCount    !== "undefined" && options.lastCount    !== null ) ? options.lastCount    : null;
    this._lastModified = ( typeof options.lastModified !== "undefined" && options.lastModified !== null ) ? options.lastModified : null;
    this._slug         = ( typeof options.slug         !== "undefined" && options.slug         !== null ) ? options.slug         : null;
    this._tallies      = ( typeof options.tallies      !== "undefined" && options.tallies      !== null ) ? options.tallies      : [];
    this._title        = ( typeof options.title        !== "undefined" && options.title        !== null ) ? options.title        : "Untitled";
  }

  get id() { return this._id }
  get lastCount() { 
    var lastCountData = {};
    if(this.tallies.length === 0) return {};

    var tallyCounts = this.tallies
      .map(tl.getTally.bind(tl))
      .map((t) => t ? t.counts : [0])
      .reduce((a,b) => a.concat(b))
      .sort((a,b) => b.startDate-a.startDate);

    if(tallyCounts.length === 0) return {};

    lastCountData.lastStartDate = tallyCounts[0].startDate;
    var lastCountTally = this.tallies
      .map(tl.getTally.bind(tl))
      .filter(t => {
        if ( t ){
          return t.counts.filter(c => {
            return c.startDate === lastCountData.lastStartDate
          }).length > 0
        }
      })[0];
    lastCountData.tallyName = lastCountTally ? lastCountTally.title : ""

    return lastCountData;      
  }
  get lastModified() { 
    if ( typeof this._lastModified === "undefined" && this._lastModified === null ){ // Pre-lastModified
      this._lastModified = moment().valueOf();
    }
    return this._lastModified 
  }
  get slug() { return this._slug }
  get tags() {
    var tags = [];

    this.tallies.forEach(function(t) {
      var tally = tl.getTally({id: t.id });
      tally.tags.forEach(function(g) {
        tags.push(g);
      })
    });

    return _.uniq(tags);
  }
  get tallies() { return this._tallies }
  get title() { return this._title }

  set id(id) { throw new Error("setting collection ID not permitted") }
  set lastCount(lastCount) { this._lastCount = lastCount }
  set lastModified(lastModified) { this._lastModified = lastModified }
  set slug(slug) { this._slug = slug }
  set tallies(tallies) { this._tallies = tallies }
  set title(title) { this._title = title }

} // Collection class

/*
  Count Class

  Responsibilities
  - Manage Count Internals
*/
class Count {
  constructor(options) {
    this._endDate      = ( typeof options.endDate      !== "undefined" && options.endDate      !== null  )  ? options.endDate      : null;
    this._geoPosition  = ( typeof options.geoPosition  !== "undefined" && options.geoPosition  !== null  )  ? options.geoPosition  : null;
    this._journey      = ( typeof options.journey      !== "undefined" && options.journey      !== false )  ? options.journey      : false;
    this._lastModified = ( typeof options.lastModified !== "undefined" && options.lastModified !== null  )  ? options.lastModified : null;
    this._note         = ( typeof options.note         !== "undefined" && options.note         !== ""    )  ? options.note         : "";
    this._number       = ( typeof options.number       !== "undefined" && options.number       !== null  )  ? options.number       : null;
    this._startDate    = ( typeof options.startDate    !== "undefined" && options.startDate    !== null  )  ? options.startDate    : moment().valueOf(); // The only thing making a count a count is a startDate, so we gotta have one of those
  }

  get endDate() { return this._endDate }
  get geoPosition() { return this._geoPosition }
  get journey() { return this._journey }
  get lastModified() { 
    if ( !this._lastModified ){ // Pre-lastModified
      this._lastModified = this._endDate? this._endDate : this._startDate;
    }
    return this._lastModified 
  }
  get note() { return this._note }
  get number() { return this._number }
  get startDate() { return this._startDate }

  set endDate(endDate) { this._endDate = endDate }
  set geoPosition(geoPosition) { this._geoPosition = geoPosition }
  set journey(journey) { this._journey = journey }
  set lastModified(lastModified) { this._lastModified = lastModified }
  set note(note) { this._note = note }
  set number(number) { this._number = number }
  set startDate(startDate) { this._startDate = startDate }
} // Count class

/*
  EncryptionLayer Class

  Responsibilities
    - Encrypt strings and JSON objects
    - Decrypt strings and JSON objects
*/
class EncryptionLayer {
  constructor(options) {
    nacl_factory.instantiate(function (nacl) {
      this._nacl = nacl
    }.bind(this));
  }

  keygen(seed) {

    var result = [], version;

    // We have no starter seed at all, so we randomly generate a 32-character seed, and set version to 0.1
    if(!seed){
      result = this._nacl.random_bytes(32);
      version = 0.1;
    }

    // We have a seed, but it isn't the right length
    else if(seed.length > 0 && seed.length !== 32){
      throw new Error("seed must be exactly 32 chars");
    }
    
    // We have a seed and it is the right length
    else if(seed.length > 0 && seed.length === 32){
      for(var i = 0; i < seed.length; i++)
      {
        result.push(seed.substring(i, i + 1).charCodeAt());
      }
      result = Uint8Array.from(result);
      version = 1.0;
    }
    
    // TODO scrypt?
    var keyPair = this._nacl.crypto_box_seed_keypair(result);
    return {
      publicKey: keyPair.boxPk,
      privateKey: keyPair.boxSk,
      securityVersion: version
    };
  } // keygen

  decrypt(encryptedObj, keypair) {
    var publicKey, privateKey;

    if(typeof keypair !== "undefined") {
      publicKey = keypair[0]
      privateKey = keypair[1]
    } else {
      privateKey = this.identity.private
      publicKey = this.identity.public
    }

    var packet = JSON.parse(encryptedObj);
    var decoded = this._nacl.crypto_box_open(
      Uint8Array.from(packet.cryptobox.split(',')),
      Uint8Array.from(packet.nonce.split(',')),
      publicKey,
      privateKey
    );

    var decodedValue = null;
    try {
      decodedValue = JSON.parse(this._nacl.decode_utf8(decoded));
    } catch (e) {
      decodedValue = this._nacl.decode_utf8(decoded);
    }
    return decodedValue;
  } // decrypt

  encrypt(value, keypair) {
    var publicKey, privateKey;

    if(!value) return;

    if(typeof keypair !== "undefined") {
      publicKey = keypair[0]
      privateKey = keypair[1]
    } else {
      privateKey = this.identity.private
      publicKey = this.identity.public
    }

    var encoded = this._nacl.encode_utf8(value);
    var nonce = this._nacl.crypto_box_random_nonce();
    var cryptobox = this._nacl.crypto_box(encoded, nonce, publicKey, privateKey);
    return JSON.stringify({ cryptobox: cryptobox.toString(), nonce: nonce.toString() });
  } // encrypt

  loadIdentity(callback) {
    var dbStore = dbengine.db.transaction(['db'], 'readwrite').objectStore('db');
    dbStore.get(1).onsuccess = (event) => {
      var result = event.target.result;

      this.identity = {
        public: result.identity.publicKey,
        private: result.identity.privateKey,
        securityVersion: result.identity.securityVersion
      };

      var solid = false;
      if(result.identity.publicKey && result.identity.privateKey) {
        solid = true;
      }

      callback(solid);
    };
  } // loadIdentity

  get identity() { return this._identity }

  set identity(value) {
    this._identity = value;
  }

  setIdentity(identity) {
    var dbStore = dbengine.db.transaction(['db'], 'readwrite').objectStore('db');
    var getRequest = dbStore.get(1);

    getRequest.onsuccess = (event) => {
      var result = event.target.result;

      result.identity = {
        publicKey: identity.publicKey,
        privateKey: identity.privateKey,
        securityVersion: identity.securityVersion
      };

      this.identity = identity;
      var request = dbStore.put(result);

      var callLoadIdentity = setInterval(function(){
        tl.encryption.loadIdentity((success) => {
            if(success) {
              clearInterval(callLoadIdentity);
              document.dispatchEvent(new CustomEvent('identity-loaded', {}));
            }
          });
      },tl.syncInterval);

    } // getRequester
  } // setIdentity
} // EncryptionLayer class


class TLP2P {
  constructor(options) {
    // this._ipfs = new Ipfs({
    //   EXPERIMENTAL: {
    //     pubsub: true
    //   }
    // });

    // this.virtualState = {
    //   collections: [],
    //   tallies: []
    // }

    // this.ipfs.on('error', (e) => console.error(e))
    // this.ipfs.on('ready', async () => {
    // this._orbitdb = new OrbitDB(this.ipfs);
    document.addEventListener('api-ready', async (e) => {
      this._ipfsApi = new IpfsApi("us-east-2a.ipfs.tallylab.com", 443, { "protocol": "https" });
    });
  }

  async create_ipns_hash(){

    var key = await tl.p2p.get_or_create_key();

    tl.p2p.derive_ipns_name();

    document.dispatchEvent(new CustomEvent('ipns-hash-created', {}));

  }

  derive_ipns_name(){

    fetch('https://us-east-2a.ipfs.tallylab.com/derive_ipns_name/'+tl.encryption.identity.public.toString())
      .then(function(res){ return res.json(); })
      .then(function(data){
        if ( !data || !data[0] || !data[0].id ){
          document.dispatchEvent(new CustomEvent('ipns-name-notfound', {}));
        } else {
          localStorage.setItem("ipns_hash",data[0].id);
          document.dispatchEvent(new CustomEvent('ipns-name-derived', {}));
        }

      }); // fetch derive_ipns_name

  }

  async get_or_create_key() {
    try {
      var key = await this.ipfsApi.key.gen(tl.encryption.identity.public.toString(), {
        type: "rsa",
        size: 2048
      });
      return key.name
    } catch (e) {
      console.log("Key already exists, returning public key.")
      return tl.encryption.identity.public.toString()
    }

  }

//   async append(eventsource, operation, data) {
//     try {
//       var stringifiedData = JSON.stringify(data)
//     } catch (e) {
//       throw new Error("Log data must be JSON")
//     }

//     const encryptedData = tl.encryption.encrypt(stringifiedData, [data.publicKey, data.privateKey])
//     const hash = await eventsource._addOperation({
//       op: operation,
//       value: encryptedData
//     })

//     console.log(this.values(eventsource, data));
//     return hash;
// .  }
  // verifyState() {
  //   if(JSON.stringify(this.virtualState.collections) !== JSON.stringify(tl.collections)) {
  //     throw new Error("Collections not consistent");
  //   }
  //   if(JSON.stringify(this.virtualState.tallies) !== JSON.stringify(tl.tallies)) {
  //     throw new Error("Tallies not consistent");
  //   }

  //   console.log("State looks good!");
  // }


  // get eventsource() { return this._eventsource }
  // get ipfs() { return this._ipfs }
  get ipfsApi() { return this._ipfsApi }
  // get orbitdb() { return this._orbitdb }

  // values(eventsource, context) {
  //   var values = eventsource.iterator({ limit: -1 }).collect()

  //   return values.map((e) => {
  //     return {
  //       op: e.payload.op,
  //       value: tl.encryption.decrypt(e.payload.value, [context.publicKey, context.privateKey])
  //     }
  //   })
  // }

  // get state() {
  //   this.values.reduce((accumulator, currentEntry) => {
  //     // Not gonna fuck with accumulator for now
  //     // TODO replace virtualstate with real state

  //     switch(currentEntry.op) {
  //       case "BASELINE":
  //         this.virtualState.collections = currentEntry.value.collections.map((c) => {
  //           return new Collection({
  //             id: c._id,
  //             lastCount: c._lastCount,
  //             lastModified: c._lastModified,
  //             slug: c._slug,
  //             tallies: c._tallies,
  //             title:  c._title
  //           });
  //         });
  //         this.virtualState.tallies = currentEntry.value.tallies.map((t) => {
  //           return new Tally({
  //             id: t._id,
  //             collections: t._collections,
  //             counts: t._counts,
  //             goalPeriod: t._goalPeriod,
  //             goalTotal: t._goalTotal,
  //             goalType: t._goalType,
  //             lastCount: t._lastCount,
  //             lastModified: t._lastModified,
  //             slug: t._slug,
  //             tags: t._tags,
  //             timer: t._timer,
  //             title: t._title,
  //             value: t._value
  //           })
  //         });
  //         console.log(this.virtualState);
  //         break;
  //       default:
  //         break;
  //     }
  //   }, this._eventsource.values);

  //   this.verifyState();
  // }

  // set eventsource(ipfs) { throw new Error("Property is read only") }
  // set ipfs(ipfs) { throw new Error("Property is read only") }
  set ipfsApi(ipfs) { throw new Error("Property is read only") }
  // set orbitdb(orbitdb) { throw new Error("Property is read only") }
}
// end api.js
