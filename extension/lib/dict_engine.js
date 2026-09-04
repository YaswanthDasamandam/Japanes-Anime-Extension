// Japanese-English Dictionary for Chrome Extension Content Scripts
(function () {
  const LOCAL_DICTIONARY = {
    // Pronouns & Anime Address
    'お前': { kana: 'おまえ', romaji: 'omae', meanings: ['you (informal/blunt, common in anime)'], pos: 'pronoun', jlpt: 'N3', anime: true },
    '俺': { kana: 'おれ', romaji: 'ore', meanings: ['I, me (informal male, common in anime)'], pos: 'pronoun', jlpt: 'N3', anime: true },
    '私': { kana: 'わたし', romaji: 'watashi', meanings: ['I, me (polite/standard)'], pos: 'pronoun', jlpt: 'N5' },
    '僕': { kana: 'ぼく', romaji: 'boku', meanings: ['I, me (male, polite/casual)'], pos: 'pronoun', jlpt: 'N5' },
    '貴様': { kana: 'きさま', romaji: 'kisama', meanings: ['you bastard, you (hostile)'], pos: 'pronoun', anime: true },
    'あんた': { kana: 'あんた', romaji: 'anta', meanings: ['you (casual, familiar)'], pos: 'pronoun', jlpt: 'N4' },
    '彼': { kana: 'かれ', romaji: 'kare', meanings: ['he, him, boyfriend'], pos: 'pronoun', jlpt: 'N4' },
    '彼女': { kana: 'かのじょ', romaji: 'kanojo', meanings: ['she, her, girlfriend'], pos: 'pronoun', jlpt: 'N4' },
    '達': { kana: 'たち', romaji: 'tachi', meanings: ['plural suffix (we, they, people)'], pos: 'suffix', jlpt: 'N5' },
    '俺たち': { kana: 'おれたち', romaji: 'oretachi', meanings: ['we, us (casual male)'], pos: 'pronoun', jlpt: 'N3' },
    '私たち': { kana: 'わたしたち', romaji: 'watashitachi', meanings: ['we, us (standard)'], pos: 'pronoun', jlpt: 'N5' },

    // Verbs
    '死ぬ': { kana: 'しぬ', romaji: 'shinu', meanings: ['to die, pass away'], pos: 'verb (godan)', jlpt: 'N4' },
    '死んでいる': { kana: 'しんでいる', romaji: 'shinde iru', meanings: ['is dead, already dead (continuous state)'], pos: 'verb phrase', jlpt: 'N4' },
    '行く': { kana: 'いく', romaji: 'iku', meanings: ['to go, move towards'], pos: 'verb (godan)', jlpt: 'N5' },
    '来る': { kana: 'くる', romaji: 'kuru', meanings: ['to come, arrive'], pos: 'verb (kuru)', jlpt: 'N5' },
    '飛ぶ': { kana: 'とぶ', romaji: 'tobu', meanings: ['to fly, leap, jump'], pos: 'verb (godan)', jlpt: 'N4' },
    '飛んでくる': { kana: 'とんでくる', romaji: 'tondekuru', meanings: ['to come flying (towards)'], pos: 'verb phrase', jlpt: 'N3' },
    '言う': { kana: 'いう', romaji: 'iu', meanings: ['to say, speak, tell'], pos: 'verb (godan)', jlpt: 'N5' },
    '見る': { kana: 'みる', romaji: 'miru', meanings: ['to see, watch, look'], pos: 'verb (ichidan)', jlpt: 'N5' },
    '聞く': { kana: 'きく', romaji: 'kiku', meanings: ['to hear, listen, ask'], pos: 'verb (godan)', jlpt: 'N5' },
    '知る': { kana: 'しる', romaji: 'shiru', meanings: ['to know, understand'], pos: 'verb (godan)', jlpt: 'N5' },
    '戦う': { kana: 'たたかう', romaji: 'tatakau', meanings: ['to fight, battle, combat'], pos: 'verb (godan)', jlpt: 'N3', anime: true },
    '戦い': { kana: 'たたかい', romaji: 'tatakai', meanings: ['battle, fight, conflict'], pos: 'noun', jlpt: 'N3', anime: true },
    '進む': { kana: 'すすむ', romaji: 'susumu', meanings: ['to advance, proceed forward'], pos: 'verb (godan)', jlpt: 'N4' },
    '降る': { kana: 'ふる', romaji: 'furu', meanings: ['to fall (rain, snow)'], pos: 'verb (godan)', jlpt: 'N5' },
    '降って': { kana: 'ふって', romaji: 'futte', meanings: ['falling (te-form of furu)'], pos: 'verb (te-form)', jlpt: 'N5' },
    '勉強': { kana: 'べんきょう', romaji: 'benkyou', meanings: ['study, diligence'], pos: 'noun / suru-verb', jlpt: 'N5' },
    '準備': { kana: 'じゅんび', romaji: 'junbi', meanings: ['preparation, arrangements'], pos: 'noun / suru-verb', jlpt: 'N4' },
    'これから': { kana: 'これから', romaji: 'korekara', meanings: ['from now on, after this'], pos: 'noun / adverb', jlpt: 'N4' },

    // Adjectives
    '寒い': { kana: 'さむい', romaji: 'samui', meanings: ['cold (weather/ambient temperature)'], pos: 'i-adjective', jlpt: 'N5' },
    '暑い': { kana: 'あつい', romaji: 'atsui', meanings: ['hot (weather/climate)'], pos: 'i-adjective', jlpt: 'N5' },
    'いい': { kana: 'いい', romaji: 'ii', meanings: ['good, nice, fine'], pos: 'i-adjective', jlpt: 'N5' },
    '強い': { kana: 'つよい', romaji: 'tsuyoi', meanings: ['strong, powerful'], pos: 'i-adjective', jlpt: 'N4' },
    '弱い': { kana: 'よわい', romaji: 'yowai', meanings: ['weak, delicate'], pos: 'i-adjective', jlpt: 'N4' },
    'すごい': { kana: 'すごい', romaji: 'sugoi', meanings: ['amazing, incredible, terrible'], pos: 'i-adjective', jlpt: 'N4', anime: true },

    // Nouns & Time
    '今日': { kana: 'きょう', romaji: 'kyou', meanings: ['today, this day'], pos: 'noun', jlpt: 'N5' },
    '今': { kana: 'いま', romaji: 'ima', meanings: ['now, right now'], pos: 'noun / adverb', jlpt: 'N5' },
    '朝': { kana: 'あさ', romaji: 'asa', meanings: ['morning'], pos: 'noun', jlpt: 'N5' },
    '雨': { kana: 'あめ', romaji: 'ame', meanings: ['rain'], pos: 'noun', jlpt: 'N5' },
    '天気': { kana: 'てんき', romaji: 'tenki', meanings: ['weather'], pos: 'noun', jlpt: 'N5' },
    '人': { kana: 'ひと', romaji: 'hito', meanings: ['person, human'], pos: 'noun', jlpt: 'N5' },
    '兵士': { kana: 'へいし', romaji: 'heishi', meanings: ['soldier, troop, warrior'], pos: 'noun', jlpt: 'N2', anime: true },
    '仲間': { kana: 'なかま', romaji: 'nakama', meanings: ['comrade, friend, crew member'], pos: 'noun', jlpt: 'N3', anime: true },
    '敵': { kana: 'てき', romaji: 'teki', meanings: ['enemy, adversary'], pos: 'noun', jlpt: 'N3', anime: true },
    '力': { kana: 'ちから', romaji: 'chikara', meanings: ['power, strength, force'], pos: 'noun', jlpt: 'N4' },
    '心': { kana: 'こころ', romaji: 'kokoro', meanings: ['heart, mind, spirit'], pos: 'noun', jlpt: 'N4' },
    '顔': { kana: 'かお', romaji: 'kao', meanings: ['face, expression'], pos: 'noun', jlpt: 'N5' },
    '何': { kana: 'なに', romaji: 'nani', meanings: ['what, which'], pos: 'pronoun', jlpt: 'N5' },

    // Adverbs & Connectors
    'もう': { kana: 'もう', romaji: 'mou', meanings: ['already, yet, anymore'], pos: 'adverb', jlpt: 'N5' },
    'まだ': { kana: 'まだ', romaji: 'mada', meanings: ['still, not yet'], pos: 'adverb', jlpt: 'N5' },
    'ここ': { kana: 'ここ', romaji: 'koko', meanings: ['here, this place'], pos: 'pronoun', jlpt: 'N5' },
    'どこ': { kana: 'どこ', romaji: 'doko', meanings: ['where'], pos: 'pronoun', jlpt: 'N5' },
    'なぜ': { kana: 'なぜ', romaji: 'naze', meanings: ['why, for what reason'], pos: 'adverb', jlpt: 'N4' },

    // Particles
    'は': { kana: 'は (wa)', romaji: 'wa', meanings: ['topic marker particle ("as for...")'], pos: 'particle', jlpt: 'N5' },
    'が': { kana: 'が', romaji: 'ga', meanings: ['subject marker particle (emphasizes subject)'], pos: 'particle', jlpt: 'N5' },
    'を': { kana: 'を (o)', romaji: 'o', meanings: ['direct object marker particle'], pos: 'particle', jlpt: 'N5' },
    'に': { kana: 'に', romaji: 'ni', meanings: ['target/direction/time particle ("at", "to", "in")'], pos: 'particle', jlpt: 'N5' },
    'で': { kana: 'で', romaji: 'de', meanings: ['location of action / means ("by", "at", "with")'], pos: 'particle', jlpt: 'N5' },
    'の': { kana: 'の', romaji: 'no', meanings: ['possessive particle ("of", "\'s")'], pos: 'particle', jlpt: 'N5' },
    'も': { kana: 'も', romaji: 'mo', meanings: ['inclusive particle ("also", "too", "even")'], pos: 'particle', jlpt: 'N5' },
    'か': { kana: 'か', romaji: 'ka', meanings: ['question particle ("?")'], pos: 'particle', jlpt: 'N5' },
    'ね': { kana: 'ね', romaji: 'ne', meanings: ['agreement particle ("isn\'t it?", "right?")'], pos: 'particle', jlpt: 'N5' },
    'よ': { kana: 'よ', romaji: 'yo', meanings: ['emphasis particle ("I tell you!", "you know!")'], pos: 'particle', jlpt: 'N5' },
    'から': { kana: 'から', romaji: 'kara', meanings: ['from, since, because'], pos: 'particle', jlpt: 'N5' },
    'まで': { kana: 'まで', romaji: 'made', meanings: ['until, up to, as far as'], pos: 'particle', jlpt: 'N5' },
    'と': { kana: 'と', romaji: 'to', meanings: ['and, with (exhaustive list or companion)'], pos: 'particle', jlpt: 'N5' },

    // Copula & Auxiliaries
    'です': { kana: 'です', romaji: 'desu', meanings: ['is, are, to be (polite copula)'], pos: 'copula', jlpt: 'N5' },
    'だ': { kana: 'だ', romaji: 'da', meanings: ['is, are, to be (informal/plain copula)'], pos: 'copula', jlpt: 'N5' },
    'ます': { kana: 'ます', romaji: 'masu', meanings: ['polite verb ending'], pos: 'auxiliary verb', jlpt: 'N5' },
    'ない': { kana: 'ない', romaji: 'nai', meanings: ['is not, does not exist (negative)'], pos: 'adjective / auxiliary', jlpt: 'N5' }
  };

  const romajiIndex = new Map();
  for (const [key, entry] of Object.entries(LOCAL_DICTIONARY)) {
    const normRomaji = entry.romaji.toLowerCase().replace(/[\s\-_]/g, '');
    if (!romajiIndex.has(normRomaji)) romajiIndex.set(normRomaji, []);
    romajiIndex.get(normRomaji).push({ kanji: key, ...entry });
  }

  function lookupWord(query) {
    if (!query) return [];
    const clean = query.trim();

    if (LOCAL_DICTIONARY[clean]) return [{ kanji: clean, ...LOCAL_DICTIONARY[clean] }];

    const normRomaji = clean.toLowerCase().replace(/[\s\-_]/g, '');
    if (romajiIndex.has(normRomaji)) return romajiIndex.get(normRomaji);

    // De-inflections
    const deinflected = [];
    if (normRomaji.endsWith('nde')) {
      deinflected.push(normRomaji.slice(0, -3) + 'nu', normRomaji.slice(0, -3) + 'mu', normRomaji.slice(0, -3) + 'bu');
    } else if (normRomaji.endsWith('ite')) {
      deinflected.push(normRomaji.slice(0, -3) + 'ku');
    } else if (normRomaji.endsWith('tte')) {
      deinflected.push(normRomaji.slice(0, -3) + 'u', normRomaji.slice(0, -3) + 'tsu', normRomaji.slice(0, -3) + 'ru');
    } else if (normRomaji.endsWith('shite')) {
      deinflected.push(normRomaji.slice(0, -5) + 'suru');
    }

    for (const candidate of deinflected) {
      if (romajiIndex.has(candidate)) return romajiIndex.get(candidate);
    }

    for (const [romKey, entries] of romajiIndex.entries()) {
      if (normRomaji.startsWith(romKey) && romKey.length >= 3) return entries;
    }

    return [];
  }

  const exportObj = {
    LOCAL_DICTIONARY,
    lookupWord
  };

  if (typeof window !== 'undefined') {
    window.AnimeJapanese = exportObj;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
})();
