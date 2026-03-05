// UIL Spelling & Vocabulary Practice - Word Origins
// Language of origin detection via patterns and manual tags
'use strict';

// Manual tags for practice test words and notable words
var WORD_ORIGINS = {
  // Greek
  "pediatrician":"Greek","xenophile":"Greek","genome":"Greek","eucalyptus":"Greek",
  "oxycephaly":"Greek","akaryocyte":"Greek","pyriform":"Greek","arrhythmia":"Greek",
  "theocentric":"Greek","granulocyte":"Greek","geophagy":"Greek","agouti":"Greek",
  "antithesis":"Greek","hippocrene":"Greek","sericeous":"Greek","heptathlon":"Greek",
  "rhonchus":"Greek","paleozoology":"Greek","otolaryngology":"Greek","lycanthropy":"Greek",
  "thaumatology":"Greek","paradigm":"Greek","myiasis":"Greek","minotaur":"Greek",
  "pomology":"Greek","platyrrhine":"Greek","retinoscopy":"Greek","dendritic":"Greek",
  "rhinencephalon":"Greek","solfatara":"Greek","iridescence":"Greek","kineticism":"Greek",
  "hypnophobia":"Greek","blastula":"Greek","chameleonic":"Greek","agnosia":"Greek",
  "myelogram":"Greek","icarus":"Greek","mycetoma":"Greek","meteoroid":"Greek",
  "tumorigenic":"Greek","ornithosis":"Greek","tritanopia":"Greek","oligoclase":"Greek",
  "cochlea":"Greek","psych":"Greek","echolocation":"Greek","hydrogeology":"Greek",
  "ichthyic":"Greek","lymphoma":"Greek","oligarchy":"Greek","dyspepsia":"Greek",

  // Latin
  "quintessential":"Latin","consentaneous":"Latin","encroachment":"Latin",
  "politesse":"Latin","chancellor":"Latin","vesicate":"Latin","dictum":"Latin",
  "ostensibly":"Latin","algorism":"Latin","vaporescence":"Latin","spinescent":"Latin",
  "equilibrate":"Latin","transitionary":"Latin","gravitas":"Latin","scansorial":"Latin",
  "rubefacient":"Latin","adversarial":"Latin","leachate":"Latin","melliferous":"Latin",
  "punctilio":"Latin","coequal":"Latin","instantaneous":"Latin","repentant":"Latin",
  "advection":"Latin","disbursal":"Latin","vacuity":"Latin","maceration":"Latin",
  "calumnious":"Latin","simian":"Latin","piosity":"Latin","masculinity":"Latin",
  "salience":"Latin","irascible":"Latin","multivoltine":"Latin","nidicolous":"Latin",
  "sacerdotalism":"Latin","executrix":"Latin","luminosity":"Latin","irrecusable":"Latin",
  "nonchalant":"Latin","inculcate":"Latin","recidivist":"Latin","revelation":"Latin",
  "submergence":"Latin","aberrated":"Latin","lanuginous":"Latin","viticulture":"Latin",
  "funereal":"Latin","limacine":"Latin","depletion":"Latin","litigate":"Latin",
  "tacit":"Latin","tenuous":"Latin","rescind":"Latin","sensor":"Latin",
  "admissibility":"Latin","acclamation":"Latin","acumen":"Latin","aegis":"Latin",
  "aperture":"Latin","aqueous":"Latin","aquifer":"Latin","circumspect":"Latin",
  "collegiality":"Latin","commination":"Latin","deference":"Latin","domesticity":"Latin",
  "exclusivity":"Latin","importunity":"Latin","liquidity":"Latin","mitigate":"Latin",

  // French
  "toque":"French","saute":"French","cabaret":"French","soubrette":"French",
  "daiquiri":"French","rapprochement":"French","postiche":"French","soliloquy":"French",
  "entrechat":"French","de rigueur":"French","charge d'affaires":"French",
  "chassepot":"French","andouille":"French","missa cantata":"French",
  "fleche":"French","trebuchet":"French","reconnoiter":"French","brocatelle":"French",
  "arriere-pensee":"French","maitre d'hotel":"French","coup de grace":"French",
  "nolo contendere":"Latin","non prosequitur":"Latin","expose":"French",
  "fanfaronade":"French","brusquerie":"French","decoupage":"French",

  // German
  "bauhaus":"German","affenpinscher":"German","keeshond":"German","rottweiler":"German",
  "zwieback":"German","umlaut":"German","naugahyde":"German","maelstrom":"German",
  "bratwurst":"German","doppelganger":"German","kindergarten":"German",
  "wanderlust":"German","zeitgeist":"German","angst":"German",

  // Italian
  "vigoroso":"Italian","radicchio":"Italian","romano":"Italian","arioso":"Italian",
  "staccato":"Italian","portamento":"Italian","brio":"Italian",

  // Arabic
  "shofar":"Hebrew","ramadan":"Arabic","keffiyeh":"Arabic","tarboosh":"Arabic",
  "algorism":"Arabic","acequia":"Arabic",

  // Hebrew
  "shalom":"Hebrew","kaddish":"Hebrew","kibbutznik":"Hebrew","chutzpah":"Hebrew",

  // Japanese
  "kamikaze":"Japanese",

  // Hindi/Sanskrit
  "dhurrie":"Hindi","guru":"Sanskrit","yoga":"Sanskrit","bodhisattva":"Sanskrit",

  // Spanish
  "cinco de mayo":"Spanish","lariat":"Spanish","chorizo":"Spanish",

  // Native American
  "havasupai":"Native American",

  // Persian
  "caravan":"Persian","bazaar":"Persian","pajama":"Persian",

  // Malay
  "orangutan":"Malay","bamboo":"Malay",

  // Chinese
  "typhoon":"Chinese","ketchup":"Chinese"
};

// Pattern-based origin detection (prefix/suffix patterns)
var ORIGIN_PATTERNS = {
  Greek: [
    /^(anti|auto|bio|chrono|crypto|dys|endo|epi|eu|geo|hemi|hetero|homo|hydro|hyper|hypo|iso|macro|mega|meta|micro|mono|neo|neuro|paleo|pan|para|peri|photo|poly|proto|pseudo|psycho|syn|tele)/,
    /(cracy|genic|geny|gram|graph|graphy|iatric|logy|mania|morph|nomy|oid|ology|osis|pathy|phage|phagy|phile|philia|phobia|phone|phyte|plasm|plasty|scope|scopy|stasis|tomy)$/,
    /(ae|oe)/, /^ph[aeiou]/, /^rh/, /^ps[aeiou]/, /^pn/,
    /^(xen|xer)/, /^(chrys|crypt)/
  ],
  Latin: [
    /^(ab|ad|ante|bene|bi|cent|circum|co|com|con|contra|de|dis|ex|extra|in|inter|intra|mal|multi|non|ob|omni|per|post|pre|pro|quadr|re|retro|semi|sub|super|supra|trans|tri|ultra|un|uni)/,
    /(able|ible|aceous|acious|acity|ade|age|al|ance|ancy|ant|ar|arian|ary|ate|ation|ative|cide|dom|ence|ency|ent|eous|fy|ify|ion|ious|ism|ist|ite|itude|ity|ive|ization|ize|ment|or|ory|ous|tion|tude|ular|ulent|ure)$/
  ],
  French: [
    /(ette|esque|eur|ier|iere|oire|eau|aux|aise|enne|iere)$/,
    /^(bon|beau|grand|petit|haut)/,
    /(ch(er|ez|aise|ine)|que|gue)$/
  ],
  German: [
    /(heit|keit|schaft|ung|chen|lein|burg|berg|stein|wald|hund|spiel)$/,
    /^(uber|wunder|zeit|welt|blitz|kraft)/
  ]
};

// Get word origin: manual lookup first, then pattern detection
App.getWordOrigin = function(word) {
  var lower = word.toLowerCase();

  // Manual lookup
  if (WORD_ORIGINS[lower]) return WORD_ORIGINS[lower];

  // Pattern detection
  var clean = lower.replace(/[^a-z]/g, '');
  for (var origin in ORIGIN_PATTERNS) {
    var patterns = ORIGIN_PATTERNS[origin];
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i].test(clean)) return origin;
    }
  }

  return null;
};

// Origin color mapping
App.getOriginColor = function(origin) {
  switch (origin) {
    case 'Greek': return { bg: '#f3e8ff', color: '#7c3aed', border: '#ddd6fe' };
    case 'Latin': return { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' };
    case 'French': return { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };
    case 'German': return { bg: '#fef9c3', color: '#a16207', border: '#fde68a' };
    case 'Italian': return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    case 'Arabic': return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    case 'Hebrew': return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
    case 'Japanese': return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    case 'Spanish': return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' };
    default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  }
};
