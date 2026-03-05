// UIL Spelling & Vocabulary Practice - Commonly Confused Pairs
// Word pairs that look or sound alike with fill-in-the-blank sentences
'use strict';

var CONFUSED_PAIRS = [
  {
    words: ["affect", "effect"],
    hint: "'Affect' is usually a verb (to influence); 'effect' is usually a noun (a result).",
    sentences: [
      { text: "The cold weather will _____ the crops.", answer: "affect" },
      { text: "The _____ of the medicine was immediate.", answer: "effect" }
    ]
  },
  {
    words: ["accept", "except"],
    hint: "'Accept' means to receive; 'except' means excluding.",
    sentences: [
      { text: "She will _____ the award on behalf of her team.", answer: "accept" },
      { text: "Everyone passed the test _____ for two students.", answer: "except" }
    ]
  },
  {
    words: ["allusion", "illusion"],
    hint: "'Allusion' is an indirect reference; 'illusion' is a false perception.",
    sentences: [
      { text: "The author made an _____ to Greek mythology.", answer: "allusion" },
      { text: "The magician created the _____ of a floating card.", answer: "illusion" }
    ]
  },
  {
    words: ["complement", "compliment"],
    hint: "'Complement' means to complete; 'compliment' means to praise.",
    sentences: [
      { text: "The red wine will _____ the steak perfectly.", answer: "complement" },
      { text: "She received a generous _____ on her presentation.", answer: "compliment" }
    ]
  },
  {
    words: ["principal", "principle"],
    hint: "'Principal' means main or a school leader; 'principle' is a rule or belief.",
    sentences: [
      { text: "The _____ announced a new dress code.", answer: "principal" },
      { text: "She refused to compromise her _____.", answer: "principle" }
    ]
  },
  {
    words: ["stationary", "stationery"],
    hint: "'Stationary' means not moving; 'stationery' is writing materials.",
    sentences: [
      { text: "The car remained _____ at the red light.", answer: "stationary" },
      { text: "She bought new _____ for her thank-you notes.", answer: "stationery" }
    ]
  },
  {
    words: ["discreet", "discrete"],
    hint: "'Discreet' means careful/tactful; 'discrete' means separate/distinct.",
    sentences: [
      { text: "Please be _____ about the surprise party.", answer: "discreet" },
      { text: "The data fell into three _____ categories.", answer: "discrete" }
    ]
  },
  {
    words: ["emigrate", "immigrate"],
    hint: "'Emigrate' means to leave a country; 'immigrate' means to enter a country.",
    sentences: [
      { text: "Her family decided to _____ from Italy in 1920.", answer: "emigrate" },
      { text: "Many families _____ to the United States each year.", answer: "immigrate" }
    ]
  },
  {
    words: ["elicit", "illicit"],
    hint: "'Elicit' means to draw out; 'illicit' means illegal or forbidden.",
    sentences: [
      { text: "The teacher tried to _____ a response from the students.", answer: "elicit" },
      { text: "The police discovered _____ substances in the vehicle.", answer: "illicit" }
    ]
  },
  {
    words: ["council", "counsel"],
    hint: "'Council' is a governing body; 'counsel' means advice or an advisor.",
    sentences: [
      { text: "The city _____ voted to approve the new park.", answer: "council" },
      { text: "The lawyer provided legal _____ to her client.", answer: "counsel" }
    ]
  },
  {
    words: ["precede", "proceed"],
    hint: "'Precede' means to come before; 'proceed' means to continue.",
    sentences: [
      { text: "Chapter one will _____ chapter two in the textbook.", answer: "precede" },
      { text: "After the intermission, we will _____ with the concert.", answer: "proceed" }
    ]
  },
  {
    words: ["cite", "site", "sight"],
    hint: "'Cite' means to quote; 'site' is a location; 'sight' is vision.",
    sentences: [
      { text: "Be sure to _____ your sources in the research paper.", answer: "cite" },
      { text: "The construction _____ was closed to the public.", answer: "site" },
      { text: "The sunset was a beautiful _____ from the hilltop.", answer: "sight" }
    ]
  },
  {
    words: ["adverse", "averse"],
    hint: "'Adverse' means harmful or unfavorable; 'averse' means opposed to.",
    sentences: [
      { text: "The _____ weather conditions delayed the flight.", answer: "adverse" },
      { text: "She was not _____ to trying new foods.", answer: "averse" }
    ]
  },
  {
    words: ["conscience", "conscious"],
    hint: "'Conscience' is moral awareness; 'conscious' means awake or aware.",
    sentences: [
      { text: "His _____ would not let him lie to the judge.", answer: "conscience" },
      { text: "The patient was _____ during the entire procedure.", answer: "conscious" }
    ]
  },
  {
    words: ["ascent", "assent"],
    hint: "'Ascent' is a climb upward; 'assent' means agreement.",
    sentences: [
      { text: "The _____ to the mountain peak took six hours.", answer: "ascent" },
      { text: "The committee gave their _____ to the proposal.", answer: "assent" }
    ]
  },
  {
    words: ["tortuous", "torturous"],
    hint: "'Tortuous' means winding or complex; 'torturous' means causing torture.",
    sentences: [
      { text: "The _____ mountain road had dozens of switchbacks.", answer: "tortuous" },
      { text: "The heat made the commute absolutely _____.", answer: "torturous" }
    ]
  },
  {
    words: ["immanent", "imminent", "eminent"],
    hint: "'Immanent' means inherent; 'imminent' means about to happen; 'eminent' means distinguished.",
    sentences: [
      { text: "The divine was described as _____ in all creation.", answer: "immanent" },
      { text: "The storm's arrival was _____.", answer: "imminent" },
      { text: "The _____ scientist received the Nobel Prize.", answer: "eminent" }
    ]
  },
  {
    words: ["cede", "seed"],
    hint: "'Cede' means to yield or surrender; 'seed' is a plant embryo.",
    sentences: [
      { text: "The country agreed to _____ the territory after the treaty.", answer: "cede" },
      { text: "She planted each _____ exactly two inches deep.", answer: "seed" }
    ]
  },
  {
    words: ["capitol", "capital"],
    hint: "'Capitol' is a building; 'capital' is a city, money, or uppercase letter.",
    sentences: [
      { text: "Tourists visited the _____ building in Washington.", answer: "Capitol" },
      { text: "Austin is the _____ of Texas.", answer: "capital" }
    ]
  },
  {
    words: ["dessert", "desert"],
    hint: "'Dessert' is a sweet course; 'desert' is a dry region (or to abandon).",
    sentences: [
      { text: "For _____, we had chocolate cake and ice cream.", answer: "dessert" },
      { text: "The Sahara is the world's largest hot _____.", answer: "desert" }
    ]
  }
];
