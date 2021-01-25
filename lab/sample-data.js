var sampleTallies = [
  { 
    "title"      : "Alvin",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['high-school']
  },
  { 
    "title"      : "Barbara",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['college']
  },
  { 
    "title"      : "Clyde",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['work']
  },
  { 
    "title"      : "Dolores",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['kindergarten']
  },
  { 
    "title"      : "Earl",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['college']
  },
  { 
    "title"      : "Florence",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['work']
  },
  { 
    "title"      : "Glen",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['peace-corps']
  },
  // See below; Hattie handled separately so that she always has the most counts
  // { 
  //   "title"      : "Hattie",
  //   "timer"      : true,
  //   "value"      : "funscore",
  //   "goalPeriod" : 'month',
  //   "goalTotal"  : 1,
  //   "goalType"   : 'at-least',
  //   "counts"     : [],
  //   "tags"       : ['high-school']
  // },
  { 
    "title"      : "Ike",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['college']
  },
  { 
    "title"      : "Judy",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['peace-corps']
  }   
];

function randomDateDuration(start, end, startHour, endHour) {
  var date = new Date(+start + Math.random() * (end - start));
  var hour = startHour + Math.random() * (endHour - startHour) | 0;
  date.setHours(hour);
  var startDate = moment(date); 
  var duration = moment.duration({ 'hours' : Math.random() * 5.25 });
  var endDate = moment(startDate).add(duration);
  var randomScore = Math.floor(Math.random() * 10) + 1;

  return {
    "startDate"      : startDate.valueOf(),
    "endDate"        : endDate.valueOf(),
    "randomScore"    : randomScore
  };
}

function createSampleCollection(){

  // Create the collection
  // Note 'social log' is hard coded for now and needs to be changed elsewhere if it's changed here
  var newCollection = tl.createCollection({
    "slug" : "social-log", 
    "title" : "Social Log"
  });

  // Create tallies
  _.forEach(sampleTallies,function(data,index){
    var tallyObj = data;
        tallyObj.slug = tallyObj.title.replace(/\ /g,'-').toLowerCase();
    var newTally = tl.createTally(tallyObj,newCollection);
  });

  // Create counts
  _.forEach(newCollection.tallies,function(id,index){
    var thisTally = tl.getTally(id);
    var numCountsToGenerate = Math.floor(Math.random() * 20) + 1; // Shouldn't be zero ever, duh
    for (var j = 0; j < numCountsToGenerate; j++) {
      var newCount = randomDateDuration(moment().subtract(12,'months'),moment(),9,23);
      tl.createCount({
        "startDate" : newCount.startDate,
        "endDate"   : newCount.endDate,
        "number"    : newCount.randomScore
      },thisTally);
    }
  });

  // Create Hattie and her counts seperately so that she always has the most
  var hattieData =   { 
    "title"      : "Hattie",
    "timer"      : true,
    "value"      : "funscore",
    "goalPeriod" : 'month',
    "goalTotal"  : 1,
    "goalType"   : 'at-least',
    "counts"     : [],
    "tags"       : ['high-school'],
    "slug"       : "hattie"
  };
  var hattieTally = tl.createTally(hattieData,newCollection);
  for (var h = 0; h < 22; h++) {
    var hattieCount = randomDateDuration(moment().subtract(12,'months'),moment(),9,23);
    tl.createCount({
      "startDate" : hattieCount.startDate,
      "endDate"   : hattieCount.endDate,
      "number"    : hattieCount.randomScore
    },hattieTally);
  }

  // Assemble
  var $clone = printCollectionBox(newCollection);
  
  return $clone;
}

// end sample-data.js 
