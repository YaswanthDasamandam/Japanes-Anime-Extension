// Japanese-English Dictionary & Yomitan-Style Morphological Engine for Chrome Extension
(function () {
  // 1. High-Frequency Japanese Vocabulary (Lemmas & Common Expressions)
  const LOCAL_DICTIONARY = {
    // Pronouns & Anime Address
    'お前': { kana: 'おまえ', romaji: 'omae', meanings: ['you (informal/blunt, common in anime)'], pos: 'pronoun', jlpt: 'N3', anime: true },
    '俺': { kana: 'おれ', romaji: 'ore', meanings: ['I, me (informal male, common in anime)'], pos: 'pronoun', jlpt: 'N3', anime: true },
    '私': { kana: 'わたし', romaji: 'watashi', meanings: ['I, me (polite/standard)'], pos: 'pronoun', jlpt: 'N5' },
    '僕': { kana: 'ぼく', romaji: 'boku', meanings: ['I, me (male, polite/casual)'], pos: 'pronoun', jlpt: 'N5' },
    '貴様': { kana: 'きさま', romaji: 'kisama', meanings: ['you bastard, you (hostile)'], pos: 'pronoun', anime: true },
    'あんた': { kana: 'あんた', romaji: 'anta', meanings: ['you (casual, familiar)'], pos: 'pronoun', jlpt: 'N4' },
    '君': { kana: 'きみ', romaji: 'kimi', meanings: ['you (familiar/buddy)'], pos: 'pronoun', jlpt: 'N5' },
    '彼': { kana: 'かれ', romaji: 'kare', meanings: ['he, him, boyfriend'], pos: 'pronoun', jlpt: 'N4' },
    '彼女': { kana: 'かのじょ', romaji: 'kanojo', meanings: ['she, her, girlfriend'], pos: 'pronoun', jlpt: 'N4' },
    '達': { kana: 'たち', romaji: 'tachi', meanings: ['plural suffix (we, they, people)'], pos: 'suffix', jlpt: 'N5' },
    '俺たち': { kana: 'おれたち', romaji: 'oretachi', meanings: ['we, us (casual male)'], pos: 'pronoun', jlpt: 'N3' },
    '私たち': { kana: 'わたしたち', romaji: 'watashitachi', meanings: ['we, us (standard)'], pos: 'pronoun', jlpt: 'N5' },
    'みんな': { kana: 'みんな', romaji: 'minna', meanings: ['everyone, all of us'], pos: 'noun / pronoun', jlpt: 'N5' },

    // Food, Soba & Dining
    '食べる': { kana: 'たべる', romaji: 'taberu', meanings: ['to eat, consume food'], pos: 'verb (ichidan)', jlpt: 'N5' },
    '飲む': { kana: 'のむ', romaji: 'nomu', meanings: ['to drink, swallow'], pos: 'verb (godan)', jlpt: 'N5' },
    '美味しい': { kana: 'おいしい', romaji: 'oishii', meanings: ['delicious, tasty, good food'], pos: 'i-adjective', jlpt: 'N5' },
    '美味': { kana: 'びみ', romaji: 'bimi', meanings: ['deliciousness, delicacy'], pos: 'noun / na-adj', jlpt: 'N1' },
    'まずい': { kana: 'まずい', romaji: 'mazui', meanings: ['bad-tasting, terrible'], pos: 'i-adjective', jlpt: 'N5' },
    '量': { kana: 'りょう', romaji: 'ryou', meanings: ['quantity, amount, volume, portion'], pos: 'noun', jlpt: 'N3' },
    '安い': { kana: 'やすい', romaji: 'yasui', meanings: ['cheap, inexpensive, peaceful'], pos: 'i-adjective', jlpt: 'N5' },
    '高い': { kana: 'たかい', romaji: 'takai', meanings: ['expensive, high, tall'], pos: 'i-adjective', jlpt: 'N5' },
    '飯': { kana: 'めし', romaji: 'meshi', meanings: ['meal, cooked rice, food'], pos: 'noun', jlpt: 'N3' },
    'ご飯': { kana: 'ごはん', romaji: 'gohan', meanings: ['meal, rice'], pos: 'noun', jlpt: 'N5' },
    '料理': { kana: 'りょうり', romaji: 'ryouri', meanings: ['cooking, cuisine, dish'], pos: 'noun / suru-verb', jlpt: 'N5' },
    '店': { kana: 'みせ', romaji: 'mise', meanings: ['shop, store, restaurant'], pos: 'noun', jlpt: 'N5' },

    // Numbers & Rankings
    '一番': { kana: 'いちばん', romaji: 'ichiban', meanings: ['number one, first, best, most'], pos: 'noun / adverb', jlpt: 'N5' },
    '番': { kana: 'ばん', romaji: 'ban', meanings: ['number, turn, watch'], pos: 'noun / suffix', jlpt: 'N5' },
    '一': { kana: 'いち', romaji: 'ichi', meanings: ['one, single'], pos: 'noun', jlpt: 'N5' },
    '二': { kana: 'に', romaji: 'ni', meanings: ['two'], pos: 'noun', jlpt: 'N5' },
    '三': { kana: 'さん', romaji: 'san', meanings: ['three'], pos: 'noun', jlpt: 'N5' },

    // Verbs - Common & Cognitive
    '思う': { kana: 'おもう', romaji: 'omou', meanings: ['to think, feel, believe, consider'], pos: 'verb (godan)', jlpt: 'N5' },
    '考える': { kana: 'かんがえる', romaji: 'kangaeru', meanings: ['to consider, contemplate, think over'], pos: 'verb (ichidan)', jlpt: 'N4' },
    '知る': { kana: 'しる', romaji: 'shiru', meanings: ['to know, understand, be aware of'], pos: 'verb (godan)', jlpt: 'N5' },
    '分かる': { kana: 'わかる', romaji: 'wakaru', meanings: ['to understand, comprehend, realize'], pos: 'verb (godan)', jlpt: 'N5' },
    '見る': { kana: 'みる', romaji: 'miru', meanings: ['to see, watch, look at'], pos: 'verb (ichidan)', jlpt: 'N5' },
    '聞く': { kana: 'きく', romaji: 'kiku', meanings: ['to hear, listen, ask'], pos: 'verb (godan)', jlpt: 'N5' },
    '言う': { kana: 'いう', romaji: 'iu', meanings: ['to say, speak, tell'], pos: 'verb (godan)', jlpt: 'N5' },
    '話す': { kana: 'はなす', romaji: 'hanasu', meanings: ['to talk, converse, speak'], pos: 'verb (godan)', jlpt: 'N5' },
    '行く': { kana: 'いく', romaji: 'iku', meanings: ['to go, proceed towards'], pos: 'verb (godan)', jlpt: 'N5' },
    '来る': { kana: 'くる', romaji: 'kuru', meanings: ['to come, arrive, approach'], pos: 'verb (kuru)', jlpt: 'N5' },
    '死ぬ': { kana: 'しぬ', romaji: 'shinu', meanings: ['to die, pass away'], pos: 'verb (godan)', jlpt: 'N4' },
    '死んでいる': { kana: 'しんでいる', romaji: 'shinde iru', meanings: ['is dead, already dead (continuous state)'], pos: 'verb phrase', jlpt: 'N4' },
    '戦う': { kana: 'たたかう', romaji: 'tatakau', meanings: ['to fight, battle, combat'], pos: 'verb (godan)', jlpt: 'N3', anime: true },
    '戦い': { kana: 'たたかい', romaji: 'tatakai', meanings: ['battle, fight, conflict'], pos: 'noun', jlpt: 'N3', anime: true },
    '勝つ': { kana: 'かつ', romaji: 'katsu', meanings: ['to win, triumph, conquer'], pos: 'verb (godan)', jlpt: 'N4' },
    '負ける': { kana: 'まける', romaji: 'makeru', meanings: ['to lose, be defeated'], pos: 'verb (ichidan)', jlpt: 'N4' },
    '助ける': { kana: 'たすける', romaji: 'tasukeru', meanings: ['to help, save, rescue'], pos: 'verb (ichidan)', jlpt: 'N4' },
    '信じる': { kana: 'しんじる', romaji: 'shinjiru', meanings: ['to believe, trust, have faith in'], pos: 'verb (ichidan)', jlpt: 'N3' },
    '待つ': { kana: 'まつ', romaji: 'matsu', meanings: ['to wait, pause, anticipate'], pos: 'verb (godan)', jlpt: 'N5' },
    '持つ': { kana: 'もつ', romaji: 'motsu', meanings: ['to hold, possess, have'], pos: 'verb (godan)', jlpt: 'N5' },
    'ある': { kana: 'ある', romaji: 'aru', meanings: ['to exist (inanimate), to have'], pos: 'verb (godan)', jlpt: 'N5' },
    'あって': { kana: 'あって', romaji: 'atte', meanings: ['existing, having (te-form of aru)'], pos: 'verb (te-form)', jlpt: 'N5' },
    'いる': { kana: 'いる', romaji: 'iru', meanings: ['to exist (animate), to be present'], pos: 'verb (ichidan)', jlpt: 'N5' },
    'する': { kana: 'する', romaji: 'suru', meanings: ['to do, make, perform'], pos: 'verb (suru)', jlpt: 'N5' },
    'させる': { kana: 'させる', romaji: 'saseru', meanings: ['to make/let someone do (causative)'], pos: 'auxiliary verb', jlpt: 'N4' },
    'もらう': { kana: 'もらう', romaji: 'morau', meanings: ['to receive, get someone to do'], pos: 'verb (godan)', jlpt: 'N5' },
    'くれる': { kana: 'くれる', romaji: 'kureru', meanings: ['to give (to me/us), do for me'], pos: 'verb (ichidan)', jlpt: 'N5' },
    'あげる': { kana: 'あげる', romaji: 'ageru', meanings: ['to give (to someone else), raise'], pos: 'verb (ichidan)', jlpt: 'N5' },

    // Adjectives & Descriptions
    '寒い': { kana: 'さむい', romaji: 'samui', meanings: ['cold (ambient/weather temperature)'], pos: 'i-adjective', jlpt: 'N5' },
    '暑い': { kana: 'あつい', romaji: 'atsui', meanings: ['hot (weather/climate)'], pos: 'i-adjective', jlpt: 'N5' },
    'いい': { kana: 'いい', romaji: 'ii', meanings: ['good, nice, fine, pleasant'], pos: 'i-adjective', jlpt: 'N5' },
    '強い': { kana: 'つよい', romaji: 'tsuyoi', meanings: ['strong, powerful, resilient'], pos: 'i-adjective', jlpt: 'N4' },
    '弱い': { kana: 'よわい', romaji: 'yowai', meanings: ['weak, delicate, fragile'], pos: 'i-adjective', jlpt: 'N4' },
    'すごい': { kana: 'すごい', romaji: 'sugoi', meanings: ['amazing, incredible, terrific'], pos: 'i-adjective', jlpt: 'N4', anime: true },
    '可愛い': { kana: 'かわいい', romaji: 'kawaii', meanings: ['cute, adorable, lovely'], pos: 'i-adjective', jlpt: 'N5' },
    '面白い': { kana: 'おもしろい', romaji: 'omoshiroi', meanings: ['interesting, funny, amusing'], pos: 'i-adjective', jlpt: 'N5' },
    '好き': { kana: 'すき', romaji: 'suki', meanings: ['liked, favorite, fondness'], pos: 'na-adjective', jlpt: 'N5' },
    '大丈夫': { kana: 'だいじょうぶ', romaji: 'daijoubu', meanings: ['all right, okay, safe, fine'], pos: 'na-adjective / adverb', jlpt: 'N5' },
    '多い': { kana: 'おおい', romaji: 'ooi', meanings: ['many, numerous, plentiful'], pos: 'i-adjective', jlpt: 'N5' },
    '少ない': { kana: 'すくない', romaji: 'sukunai', meanings: ['few, scarce, little'], pos: 'i-adjective', jlpt: 'N5' },

    // Common Casual Expressions & Adverbs
    'やっぱ': { kana: 'やっぱ', romaji: 'yappa', meanings: ['as expected, after all, you know (casual)'], pos: 'adverb', jlpt: 'N3', anime: true },
    'やっぱり': { kana: 'やっぱり', romaji: 'yappari', meanings: ['as I thought, after all, indeed'], pos: 'adverb', jlpt: 'N4' },
    'うん': { kana: 'うん', romaji: 'un', meanings: ['yes, yeah, okay (casual affirmative)'], pos: 'interjection', jlpt: 'N5' },
    'はい': { kana: 'はい', romaji: 'hai', meanings: ['yes, right, understood (polite affirmative)'], pos: 'interjection', jlpt: 'N5' },
    'いいえ': { kana: 'いいえ', romaji: 'iie', meanings: ['no, not at all'], pos: 'interjection', jlpt: 'N5' },
    'もう': { kana: 'もう', romaji: 'mou', meanings: ['already, yet, anymore'], pos: 'adverb', jlpt: 'N5' },
    'まだ': { kana: 'まだ', romaji: 'mada', meanings: ['still, not yet'], pos: 'adverb', jlpt: 'N5' },
    'とても': { kana: 'とても', romaji: 'totemo', meanings: ['very, extremely, greatly'], pos: 'adverb', jlpt: 'N5' },
    'たくさん': { kana: 'たくさん', romaji: 'takusan', meanings: ['a lot, plenty, many'], pos: 'adverb / noun', jlpt: 'N5' },
    '本当': { kana: 'ほんとう', romaji: 'hontou', meanings: ['truth, reality, really'], pos: 'noun / na-adj', jlpt: 'N5' },
    '本当に': { kana: 'ほんとうに', romaji: 'hontou ni', meanings: ['really, truly, genuinely'], pos: 'adverb', jlpt: 'N5' },
    '絶対': { kana: 'ぜったい', romaji: 'zettai', meanings: ['definitely, absolutely, unconditionally'], pos: 'adverb / noun', jlpt: 'N3', anime: true },

    // Nouns & Environment
    '人': { kana: 'ひと', romaji: 'hito', meanings: ['person, human, people'], pos: 'noun', jlpt: 'N5' },
    '皆': { kana: 'みんな', romaji: 'minna', meanings: ['everyone, all of us'], pos: 'noun / pronoun', jlpt: 'N4' },
    'みんな': { kana: 'みんな', romaji: 'minna', meanings: ['everyone, all of us'], pos: 'noun / pronoun', jlpt: 'N5' },
    '今日': { kana: 'きょう', romaji: 'kyou', meanings: ['today, this day'], pos: 'noun', jlpt: 'N5' },
    '今': { kana: 'いま', romaji: 'ima', meanings: ['now, right now'], pos: 'noun / adverb', jlpt: 'N5' },
    '時': { kana: 'とき', romaji: 'toki', meanings: ['time, moment, occasion'], pos: 'noun', jlpt: 'N5' },
    '時間': { kana: 'じかん', romaji: 'jikan', meanings: ['time, duration, hours'], pos: 'noun', jlpt: 'N5' },
    '雨': { kana: 'あめ', romaji: 'ame', meanings: ['rain'], pos: 'noun', jlpt: 'N5' },
    '天気': { kana: 'てんき', romaji: 'tenki', meanings: ['weather'], pos: 'noun', jlpt: 'N5' },
    '力': { kana: 'ちから', romaji: 'chikara', meanings: ['power, strength, force'], pos: 'noun', jlpt: 'N4' },
    '心': { kana: 'こころ', romaji: 'kokoro', meanings: ['heart, mind, spirit'], pos: 'noun', jlpt: 'N4' },
    '顔': { kana: 'かお', romaji: 'kao', meanings: ['face, expression'], pos: 'noun', jlpt: 'N5' },
    '何': { kana: 'なに', romaji: 'nani', meanings: ['what, which'], pos: 'pronoun', jlpt: 'N5' },
    '誰': { kana: 'だれ', romaji: 'dare', meanings: ['who, whom'], pos: 'pronoun', jlpt: 'N5' },
    'どこ': { kana: 'どこ', romaji: 'doko', meanings: ['where'], pos: 'pronoun', jlpt: 'N5' },

    // Grammatical Particles & Copula
    'は': { kana: 'は', romaji: 'wa', meanings: ['topic marker particle ("as for...")'], pos: 'particle', jlpt: 'N5' },
    'が': { kana: 'が', romaji: 'ga', meanings: ['subject marker particle'], pos: 'particle', jlpt: 'N5' },
    'を': { kana: 'を', romaji: 'o', meanings: ['direct object marker particle'], pos: 'particle', jlpt: 'N5' },
    'に': { kana: 'に', romaji: 'ni', meanings: ['target/direction/time particle ("at", "to", "in")'], pos: 'particle', jlpt: 'N5' },
    'で': { kana: 'で', romaji: 'de', meanings: ['location of action / means ("by", "at", "with")'], pos: 'particle', jlpt: 'N5' },
    'の': { kana: 'の', romaji: 'no', meanings: ['possessive / nominalizer particle ("of", "\'s")'], pos: 'particle', jlpt: 'N5' },
    'も': { kana: 'も', romaji: 'mo', meanings: ['inclusive particle ("also", "too", "even")'], pos: 'particle', jlpt: 'N5' },
    'か': { kana: 'か', romaji: 'ka', meanings: ['question particle ("?")'], pos: 'particle', jlpt: 'N5' },
    'ね': { kana: 'ね', romaji: 'ne', meanings: ['agreement particle ("right?", "isn\'t it?")'], pos: 'particle', jlpt: 'N5' },
    'よ': { kana: 'よ', romaji: 'yo', meanings: ['emphasis particle ("I tell you!")'], pos: 'particle', jlpt: 'N5' },
    'よね': { kana: 'よね', romaji: 'yone', meanings: ['confirmation particle ("you know, right?")'], pos: 'particle', jlpt: 'N5' },
    'さ': { kana: 'さ', romaji: 'sa', meanings: ['casual sentence particle ("you see...")'], pos: 'particle', jlpt: 'N4' },
    'から': { kana: 'から', romaji: 'kara', meanings: ['from, since, because'], pos: 'particle', jlpt: 'N5' },
    'まで': { kana: 'まで', romaji: 'made', meanings: ['until, up to, as far as'], pos: 'particle', jlpt: 'N5' },
    'と': { kana: 'と', romaji: 'to', meanings: ['and, with (connector or companion)'], pos: 'particle', jlpt: 'N5' },
    'です': { kana: 'です', romaji: 'desu', meanings: ['is, are, to be (polite copula)'], pos: 'copula', jlpt: 'N5' },
    'だ': { kana: 'だ', romaji: 'da', meanings: ['is, are, to be (plain copula)'], pos: 'copula', jlpt: 'N5' }
  };

  // 2. Comprehensive Joyo Kanji Character Reading Map (Ensures raw Kanji NEVER shows in Rōmaji)
  const KANJI_READINGS = {
    '安': { kana: 'やす', romaji: 'yasu', meaning: 'cheap, peaceful' },
    '量': { kana: 'りょう', romaji: 'ryou', meaning: 'quantity, amount' },
    '食': { kana: 'た', romaji: 'ta', meaning: 'eat, food' },
    '思': { kana: 'おも', romaji: 'omo', meaning: 'think, thought' },
    '美': { kana: 'び', romaji: 'bi', meaning: 'beauty, delicious' },
    '味': { kana: 'み', romaji: 'mi', meaning: 'flavor, taste' },
    '番': { kana: 'ばん', romaji: 'ban', meaning: 'number, turn' },
    '一': { kana: 'いち', romaji: 'ichi', meaning: 'one, best' },
    '二': { kana: 'に', romaji: 'ni', meaning: 'two' },
    '三': { kana: 'さん', romaji: 'san', meaning: 'three' },
    '四': { kana: 'よん', romaji: 'yon', meaning: 'four' },
    '五': { kana: 'ご', romaji: 'go', meaning: 'five' },
    '六': { kana: 'ろく', romaji: 'roku', meaning: 'six' },
    '七': { kana: 'なな', romaji: 'nana', meaning: 'seven' },
    '八': { kana: 'はち', romaji: 'hachi', meaning: 'eight' },
    '九': { kana: 'きゅう', romaji: 'kyuu', meaning: 'nine' },
    '十': { kana: 'じゅう', romaji: 'juu', meaning: 'ten' },
    '百': { kana: 'ひゃく', romaji: 'hyaku', meaning: 'hundred' },
    '千': { kana: 'せん', romaji: 'sen', meaning: 'thousand' },
    '万': { kana: 'まん', romaji: 'man', meaning: 'ten thousand' },
    '人': { kana: 'ひと', romaji: 'hito', meaning: 'person' },
    '男': { kana: 'おとこ', romaji: 'otoko', meaning: 'man, male' },
    '女': { kana: 'おんな', romaji: 'onna', meaning: 'woman, female' },
    '子': { kana: 'こ', romaji: 'ko', meaning: 'child' },
    '日': { kana: 'ひ', romaji: 'hi', meaning: 'day, sun' },
    '月': { kana: 'つき', romaji: 'tsuki', meaning: 'month, moon' },
    '年': { kana: 'とし', romaji: 'toshi', meaning: 'year' },
    '時': { kana: 'とき', romaji: 'toki', meaning: 'time, hour' },
    '分': { kana: 'ふん', romaji: 'fun', meaning: 'minute, part' },
    '今': { kana: 'いま', romaji: 'ima', meaning: 'now' },
    '前': { kana: 'まえ', romaji: 'mae', meaning: 'before, front' },
    '後': { kana: 'あと', romaji: 'ato', meaning: 'after, behind' },
    '大': { kana: 'おお', romaji: 'oo', meaning: 'big, great' },
    '小': { kana: 'ちい', romaji: 'chii', meaning: 'small, little' },
    '中': { kana: 'なか', romaji: 'naka', meaning: 'inside, middle' },
    '高': { kana: 'たか', romaji: 'taka', meaning: 'high, expensive' },
    '新': { kana: 'あたら', romaji: 'atara', meaning: 'new, fresh' },
    '古': { kana: 'ふる', romaji: 'furu', meaning: 'old' },
    '長': { kana: 'なが', romaji: 'naga', meaning: 'long, leader' },
    '白': { kana: 'しろ', romaji: 'shiro', meaning: 'white' },
    '黒': { kana: 'くろ', romaji: 'kuro', meaning: 'black' },
    '赤': { kana: 'あか', romaji: 'aka', meaning: 'red' },
    '青': { kana: 'あお', romaji: 'ao', meaning: 'blue' },
    '見': { kana: 'み', romaji: 'mi', meaning: 'see, look' },
    '聞': { kana: 'き', romaji: 'ki', meaning: 'hear, ask' },
    '言': { kana: 'い', romaji: 'i', meaning: 'say, word' },
    '話': { kana: 'はな', romaji: 'hana', meaning: 'speak, talk' },
    '読': { kana: 'よ', romaji: 'yo', meaning: 'read' },
    '書': { kana: 'か', romaji: 'ka', meaning: 'write, book' },
    '行': { kana: 'い', romaji: 'i', meaning: 'go' },
    '来': { kana: 'く', romaji: 'ku', meaning: 'come' },
    '出': { kana: 'で', romaji: 'de', meaning: 'exit, go out' },
    '入': { kana: 'はい', romaji: 'hai', meaning: 'enter' },
    '生': { kana: 'い', romaji: 'i', meaning: 'life, live' },
    '死': { kana: 'し', romaji: 'shi', meaning: 'death, die' },
    '心': { kana: 'こころ', romaji: 'kokoro', meaning: 'heart, spirit' },
    '力': { kana: 'ちから', romaji: 'chikara', meaning: 'power, strength' },
    '気': { kana: 'き', romaji: 'ki', meaning: 'spirit, mood' },
    '雨': { kana: 'あめ', romaji: 'ame', meaning: 'rain' },
    '天': { kana: 'てん', romaji: 'ten', meaning: 'heaven, sky' },
    '空': { kana: 'そら', romaji: 'sora', meaning: 'sky, empty' },
    '海': { kana: 'うみ', romaji: 'umi', meaning: 'sea, ocean' },
    '山': { kana: 'やま', romaji: 'yama', meaning: 'mountain' },
    '川': { kana: 'かわ', romaji: 'kawa', meaning: 'river' },
    '国': { kana: 'くに', romaji: 'kuni', meaning: 'country' },
    '家': { kana: 'いえ', romaji: 'ie', meaning: 'house, home' },
    '店': { kana: 'みせ', romaji: 'mise', meaning: 'shop, store' },
    '手': { kana: 'て', romaji: 'te', meaning: 'hand' },
    '足': { kana: 'あし', romaji: 'ashi', meaning: 'foot, leg' },
    '目': { kana: 'め', romaji: 'me', meaning: 'eye' },
    '口': { kana: 'くち', romaji: 'kuchi', meaning: 'mouth' },
    '顔': { kana: 'かお', romaji: 'kao', meaning: 'face' },
    '声': { kana: 'こえ', romaji: 'koe', meaning: 'voice' },
    '頭': { kana: 'あたま', romaji: 'atama', meaning: 'head' },
    '体': { kana: 'からだ', romaji: 'karada', meaning: 'body' },
    '友': { kana: 'とも', romaji: 'tomo', meaning: 'friend' },
    '敵': { kana: 'てき', romaji: 'teki', meaning: 'enemy' },
    '戦': { kana: 'たたか', romaji: 'tataka', meaning: 'fight, battle' },
    '勝': { kana: 'か', romaji: 'ka', meaning: 'win, victory' },
    '負': { kana: 'ま', romaji: 'ma', meaning: 'lose, defeat' },
    '強': { kana: 'つよ', romaji: 'tsuyo', meaning: 'strong' },
    '弱': { kana: 'よわ', romaji: 'yowa', meaning: 'weak' },
    '好': { kana: 'す', romaji: 'su', meaning: 'like, fond' },
    '信': { kana: 'しん', romaji: 'shin', meaning: 'believe, trust' },
    '待': { kana: 'ま', romaji: 'ma', meaning: 'wait' },
    '持': { kana: 'も', romaji: 'mo', meaning: 'hold, have' },
    '買': { kana: 'か', romaji: 'ka', meaning: 'buy' },
    '物': { kana: 'もの', romaji: 'mono', meaning: 'thing, object' },
    '事': { kana: 'こと', romaji: 'koto', meaning: 'matter, thing' },
    '何': { kana: 'なに', romaji: 'nani', meaning: 'what' },
    '皆': { kana: 'みな', romaji: 'mina', meaning: 'everyone, all' }
  };

  const romajiIndex = new Map();
  for (const [key, entry] of Object.entries(LOCAL_DICTIONARY)) {
    const normRomaji = entry.romaji.toLowerCase().replace(/[\s\-_]/g, '');
    if (!romajiIndex.has(normRomaji)) romajiIndex.set(normRomaji, []);
    romajiIndex.get(normRomaji).push({ kanji: key, ...entry });
  }

  /**
   * Yomitan-style morphological word lookup with algorithmic de-inflection.
   * @param {string} query - The word to search (inflected or base form)
   * @returns {Array<Object>} List of matched dictionary entries with reconstructed readings
   */
  function lookupWord(query) {
    if (!query) return [];
    const clean = query.trim();

    // 1. Direct Lemma / Word match
    if (LOCAL_DICTIONARY[clean]) {
      return [{ kanji: clean, ...LOCAL_DICTIONARY[clean] }];
    }

    // 2. Normalized Romaji match
    const normRomaji = clean.toLowerCase().replace(/[\s\-_]/g, '');
    if (romajiIndex.has(normRomaji)) {
      return romajiIndex.get(normRomaji);
    }

    // 3. Yomitan-Style Algorithmic De-inflection
    const deinflector = (typeof window !== 'undefined' && window.AnimeDeinflector) ||
                        (typeof AnimeDeinflector !== 'undefined' ? AnimeDeinflector : null) ||
                        (typeof require !== 'undefined' ? require('./deinflector.js') : null);

    if (deinflector && deinflector.deinflect) {
      const candidates = deinflector.deinflect(clean);

      for (const cand of candidates) {
        if (cand.lemma && LOCAL_DICTIONARY[cand.lemma]) {
          const lemmaEntry = LOCAL_DICTIONARY[cand.lemma];

          // Reconstruct inflected Kana and Rōmaji readings
          let inflectedKana = lemmaEntry.kana;
          let inflectedRomaji = lemmaEntry.romaji;

          if (cand.suffix && cand.replace) {
            const replaceLen = cand.replace.length;
            const baseKana = lemmaEntry.kana.endsWith(cand.replace)
              ? lemmaEntry.kana.slice(0, -replaceLen)
              : lemmaEntry.kana;

            inflectedKana = baseKana + cand.suffix;
            if (cand.particle) inflectedKana += cand.particle;

            const w = (typeof window !== 'undefined' && window.wanakana) ||
                      (typeof globalThis !== 'undefined' && globalThis.wanakana) ||
                      (typeof wanakana !== 'undefined' ? wanakana : null) ||
                      (typeof require !== 'undefined' ? require('wanakana') : null);

            if (w && w.toRomaji) {
              inflectedRomaji = w.toRomaji(inflectedKana);
            } else {
              inflectedRomaji = inflectedKana;
            }
          } else if (cand.particle) {
            inflectedKana += cand.particle;
            const w = (typeof window !== 'undefined' && window.wanakana) ||
                      (typeof globalThis !== 'undefined' && globalThis.wanakana) ||
                      (typeof wanakana !== 'undefined' ? wanakana : null) ||
                      (typeof require !== 'undefined' ? require('wanakana') : null);
            const partRom = (w && w.toRomaji) ? w.toRomaji(cand.particle) : cand.particle;
            inflectedRomaji += (inflectedRomaji ? ' ' : '') + partRom;
          }

          const tagInfo = cand.tag && cand.tag !== 'base' ? ` (${cand.tag})` : '';
          return [{
            kanji: clean,
            lemma: cand.lemma,
            kana: inflectedKana,
            romaji: inflectedRomaji,
            meanings: lemmaEntry.meanings.map(m => m + tagInfo),
            pos: lemmaEntry.pos,
            jlpt: lemmaEntry.jlpt
          }];
        }
      }
    }

    // 4. Joyo Kanji Character Reading Map (Ensures raw Kanji never shows)
    if (KANJI_READINGS[clean]) {
      const k = KANJI_READINGS[clean];
      return [{
        kanji: clean,
        kana: k.kana,
        romaji: k.romaji,
        meanings: [k.meaning],
        pos: 'kanji',
        jlpt: 'N3'
      }];
    }

    // 5. Multi-character Kanji compound fallback
    if (/^[\u4e00-\u9faf]+$/.test(clean)) {
      let combinedKana = '';
      let combinedRomaji = '';
      let combinedMeaning = [];
      let foundAny = false;

      for (const char of clean) {
        if (KANJI_READINGS[char]) {
          foundAny = true;
          combinedKana += KANJI_READINGS[char].kana;
          combinedRomaji += (combinedRomaji ? ' ' : '') + KANJI_READINGS[char].romaji;
          combinedMeaning.push(KANJI_READINGS[char].meaning);
        } else {
          combinedKana += char;
          combinedRomaji += (combinedRomaji ? ' ' : '') + char;
        }
      }

      if (foundAny) {
        return [{
          kanji: clean,
          kana: combinedKana,
          romaji: combinedRomaji,
          meanings: [combinedMeaning.join('; ')],
          pos: 'kanji compound',
          jlpt: 'Vocab'
        }];
      }
    }

    return [];
  }

  const exportObj = {
    LOCAL_DICTIONARY,
    KANJI_READINGS,
    lookupWord
  };

  if (typeof window !== 'undefined') {
    window.AnimeJapanese = exportObj;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.AnimeJapanese = exportObj;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
})();
