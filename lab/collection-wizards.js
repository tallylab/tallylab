/*
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
*/
var collectionWizards = [
  {
    "slug" : "chores",
    "title" : "Chores",
    "tallies" : [
      {
        "title" : "Replace AC Filter"
      },
      {
        "title" : "Clean Bathroom 1"
      },
      {
        "title" : "Clean Bathroom 2"
      },
      {
        "title" : "Clean Fridge"
      },
      {
        "title" : "Clear Gutters"
      },
      {
        "title" : "Dust"
      },
      {
        "title" : "Mop"
      },
      {
        "title" : "Sweep"
      },
      {
        "title" : "Vaccuum"
      },
      {
        "title" : "Water Plants"
      }
    ],
    "icon" : "glyphicons-cleaning"
  },
  {
    "slug" : "fitness",
    "title" : "Fitness",
    "tallies" : [
      {
        "title" : "Runs",
        "timer" : true,
        "value" : "miles"
      },
      {
        "title" : "Crunches",
        "value" : "set size"
      },
      {
        "title" : "Weights",
        "value" : "reps"
      },
      {
        "title" : "Pushups",
        "value" : "set size"
      },
      {
        "title" : "Stretches"
      },
      {
        "title" : "Walks",
        "timer" : true,
        "value" : "miles"
      }
    ],
    "icon" : "glyphicons-dumbbell"
  },
  {
    "slug" : "medications",
    "title" : "Medications",
    "tallies" : [
      {
        "title" : "Acetominophen"
      },
      {
        "title" : "Adderall"
      },
      {
        "title" : "Advair"
      },
      {
        "title" : "Advil"
      },
      {
        "title" : "Albuterol"
      },
      {
        "title" : "Allegra"
      },
      {
        "title" : "Amlodipine"
      },
      {
        "title" : "Cetirizine"
      },
      {
        "title" : "Claritin"
      },
      {
        "title" : "Crestor"
      },
      {
        "title" : "Flonase"
      },
      {
        "title" : "Ibuprofen"
      },
      {
        "title" : "Insulin"
      },
      {
        "title" : "Lipitor"
      },
      {
        "title" : "Lisinopril"
      },
      {
        "title" : "Loratadine"
      },
      {
        "title" : "Losartan"
      },
      {
        "title" : "Metformin"
      },
      {
        "title" : "Nexium"
      },
      {
        "title" : "Omeprazole"
      },
      {
        "title" : "Prilosec"
      },
      {
        "title" : "Spiriva"
      },
      {
        "title" : "Synthroid"
      },
      {
        "title" : "Tylenol"
      }
    ],
    "icon" : "glyphicons-medicine"
  },
  {
    "slug" : "civics",
    "title" : "Civics",
    "tallies" : [
      {
        "title" : "File Taxes",
        "goalPeriod": "year",
        "goalTotal": 1,
        "goalType": "at-least"
      },
      {
        "title" : "Jury Duty",
        "goalPeriod": "year",
        "goalTotal": 1,
        "goalType": "at-least"
      },
      {
        "title" : "Visit Library",
        "goalPeriod": "year",
        "goalTotal": 1,
        "goalType": "at-least"
      },
      {
        "title" : "Visit Museum",
        "goalPeriod": "year",
        "goalTotal": 1,
        "goalType": "at-least"
      },
      {
        "title" : "Visit Park",
        "goalPeriod": "year",
        "goalTotal": 1,
        "goalType": "at-least"
      },
      {
        "title" : "Volunteer",
        "timer" : true
      },
      {
        "title" : "Vote",
        "goalPeriod": "life",
        "goalTotal": 40,
        "goalType": "at-least"
      }
    ],
    "icon" : "glyphicons-elections"
  },
  {
    "slug" : "food",
    "title" : "Food",
    "tallies" : [ 
      {
        "title" : "Almond",
        "tags"  : ['nut','tree']
      },
      {
        "title" : "Apples",
        "tags"  : ['fruit','tree']
      },
      {
        "title" : "Avocados",
        "tags"  : ['fruit']
      },
      {
        "title" : "Bacon",
        "tags"  : ['meat','mammal']
      },
      {
        "title" : "Bananas",
        "tags"  : ['fruit','tropical']
      },
      {
        "title" : "Beef",
        "tags"  : ['meat','mammal']
      },
      {
        "title" : "Blackberries",
        "tags"  : ['fruit','berry']
      },
      {
        "title" : "Blueberries",
        "tags"  : ['fruit','berry']
      },
      {
        "title" : "Broccoli",
        "tags"  : ['vegetable']
      },
      {
        "title" : "Cantalope",
        "tags"  : ['fruit','melon']
      },
      {
        "title" : "Carrots",
        "tags"  : ['vegetable','root']
      },
      {
        "title" : "Cashews",
        "tags"  : ['nut']
      },
      {
        "title" : "Celery",
        "tags"  : ['vegetable']
      },
      {
        "title" : "Cereal",
        "tags"  : ['grain']
      },
      {
        "title" : "Cheese",
        "tags"  : ['dairy']
      },
      {
        "title" : "Chicken",
        "tags"  : ['meat','poultry']
      },
      {
        "title" : "Chickpeas",
        "tags"  : ['legume','bean']
      },
      {
        "title" : "Coffee",
        "tags"  : ['beverage','caffeinated']
      },
      {
        "title" : "Crustaceans",
        "tags"  : ['meat','seafood']
      },
      {
        "title" : "Cucumber",
        "tags"  : ['vegetable']
      },
      {
        "title" : "Egg",
        "tags"  : ['poultry']
      },
      {
        "title" : "Fish",
        "tags"  : ['seafood','meat']
      },
      {
        "title" : "Grapefruit",
        "tags"  : ['fruit','citrus']
      },
      {
        "title" : "Grapes",
        "tags"  : ['fruit','berry']
      },
      {
        "title" : "Ham",
        "tags"  : ['pork','meat']
      },
      {
        "title" : "Hazelnuts",
        "tags"  : ['nut','tree']
      },
      {
        "title" : "Honey",
        "tags"  : ['sweetener']
      },
      {
        "title" : "Honeydew",
        "tags"  : ['fruit','melon']
      },
      {
        "title" : "Kiwi fruit",
        "tags"  : ['fruit','tropical']
      },
      {
        "title" : "Lettuce",
        "tags"  : ['vegetable','green']
      },
      {
        "title" : "Macadamias",
        "tags"  : ['nut','tree']
      },
      {
        "title" : "Milk",
        "tags"  : ['dairy']
      },
      {
        "title" : "Mushrooms",
        "tags"  : ['vegetable','fungus']
      },
      {
        "title" : "Olive Oil",
        "tags"  : ['oil','vegetable']
      },
      {
        "title" : "Onions",
        "tags"  : ['vegetable']
      },
      {
        "title" : "Oranges",
        "tags"  : ['fruit','citrus']
      },
      {
        "title" : "Peanuts",
        "tags"  : ['nut','legume']
      },
      {
        "title" : "Pecans",
        "tags"  : ['nut','tree']
      },
      {
        "title" : "Pineapple",
        "tags"  : ['fruit','tropical']
      },
      {
        "title" : "Pistacchios",
        "tags"  : ['nut','tree']
      },
      {
        "title" : "Pork",
        "tags"  : ['meat']
      },
      {
        "title" : "Potato",
        "tags"  : ['vegetable','root']
      },
      {
        "title" : "Quinoa",
        "tags"  : ['grain']
      },
      {
        "title" : "Rice",
        "tags"  : ['grain']
      },
      {
        "title" : "Spinach",
        "tags"  : ['vegetable','green']
      },
      {
        "title" : "Squash",
        "tags"  : ['vegetable','gourd']
      },
      {
        "title" : "Strawberries",
        "tags"  : ['fruit','berry']
      },
      {
        "title" : "Sunflower Seeds",
        "tags"  : ['seed']
      },
      {
        "title" : "Sweet potato",
        "tags"  : ['vegetable','root']
      },
      {
        "title" : "Tea",
        "tags"  : ['beverage','caffeinated']
      },
      {
        "title" : "Tomatoes",
        "tags"  : ['vegetable']
      },
      {
        "title" : "Walnuts",
        "tags"  : ['nut','tree']
      },
      {
        "title" : "Watermelon",
        "tags"  : ['fruit','melon']
      }
    ],
    "icon" : "glyphicons-fast-food"
  },
  {
    "slug" : "menstrual-cycle",
    "title" : "Menstrual Cycle",
    "tallies" : [
      {
        "title" : "Back Pain",
        "value" : "intensity"
      },
      {
        "title" : "BCP"
      },
      {
        "title" : "BBT",
        "value" : "degrees"
      },
      {
        "title" : "Bloating",
        "value" : "intensity"
      },
      {
        "title" : "Breast Tenderness",
        "value" : "intensity"
      },
      {
        "title" : "Cramping",
        "value" : "intensity"
      },
      {
        "title" : "Flow",
        "value" : "intensity"
      },
      {
        "title" : "Headache",
        "value" : "intensity"
      }
    ],
    "icon" : "glyphicons-moon"
  },
  {
    "slug" : "mood",
    "title" : "Mood",
    "tallies" : [
      {
        "title" : "Good"
      },
      {
        "title" : "Bad"
      },
      {
        "title" : "Happy"
      },
      {
        "title" : "Sad"
      },
      {
        "title" : "Determined"
      },
      {
        "title" : "Afraid"
      },
      {
        "title" : "Hopeful"
      },
      {
        "title" : "Content"
      },
      {
        "title" : "Pained"
      },
      {
        "title" : "Aroused"
      },
      {
        "title" : "Angry"
      },
      {
        "title" : "Elated"
      },
      {
        "title" : "Anxious"
      },
      {
        "title" : "Joyful"
      },
      {
        "title" : "Ashamed"
      },
      {
        "title" : "Fascinated"
      },
      {
        "title" : "Dejected"
      },
      {
        "title" : "Focused"
      },
      {
        "title" : "Despairing"
      },
      {
        "title" : "Surprised"
      },
      {
        "title" : "Disgusted"
      },
      {
        "title" : "Wonderful"
      },
      {
        "title" : "Distressed"
      },
      {
        "title" : "Longing"
      },
      {
        "title" : "Guilty"
      },
      {
        "title" : "Panicking"
      },
      {
        "title" : "Raging"
      },
      {
        "title" : "Sorrowful"
      },
      {
        "title" : "Restless"
      }
    ],
    "icon" : "glyphicons-theater"
  },
  {
    "slug" : "symptoms",
    "title": "Symptoms",
    "tallies" : [
      {
        "title" : "Bloating"
      },
      {
        "title" : "Chest pain"
      },
      {
        "title" : "Constipation"
      },
      {
        "title" : "Cough"
      },
      {
        "title" : "Diarrhea"
      },
      {
        "title" : "Difficulty swallowing"
      },
      {
        "title" : "Dizziness"
      },
      {
        "title" : "Dry skin"
      },
      {
        "title" : "Fatigue"
      },
      {
        "title" : "Fever"
      },
      {
        "title" : "Gas"
      },
      {
        "title" : "Headache"
      },
      {
        "title" : "Heart palpitations"
      },
      {
        "title" : "Migraine"
      },
      {
        "title" : "Nasal congestion"
      },
      {
        "title" : "Nausea"
      },
      {
        "title" : "Numbness"
      },
      {
        "title" : "Runny nose"
      },
      {
        "title" : "Shortness of breath"
      },
      {
        "title" : "Sore throat"
      },
      {
        "title" : "Tingling"
      },
      {
        "title" : "Vomiting"
      },
      {
        "title" : "Wheezing"
      }
    ],
    "icon" : "glyphicons-heartbeat"
  },
  {
    "slug" : "supplements",
    "title" : "Supplements",
    "tallies" : [
      {
        "title" : "Multi-Vitamin"
      },
      {
        "title" : "B-Complex"
      },
      {
        "title" : "Vitamin C"
      },
      {
        "title" : "Calcium"
      },
      {
        "title" : "Chromium"
      },
      {
        "title" : "Vitamin B12"
      },
      {
        "title" : "Folate"
      },
      {
        "title" : "Iron"
      },
      {
        "title" : "Magnesium"
      },
      {
        "title" : "Niacin"
      },
      {
        "title" : "Potassium"
      },
      {
        "title" : "Vitamin B6"
      },
      {
        "title" : "Vitamin B2"
      },
      {
        "title" : "Selenium"
      },
      {
        "title" : "Sodium"
      },
      {
        "title" : "Vitamin A"
      },
      {
        "title" : "Vitamin D"
      },
      {
        "title" : "Vitamin E"
      },
      {
        "title" : "Vitamin K"
      },
      {
        "title" : "Zinc"
      }
    ],
    "icon" : "glyphicons-balanced-diet"
  }
];