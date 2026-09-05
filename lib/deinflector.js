// Yomitan-Style Japanese Algorithmic De-inflection Engine
(function () {
  // Casual sentence-ending particles that attach to inflected verb/adjective forms
  const TRAILING_PARTICLES = ['よね', 'よ', 'ね', 'さ', 'ぞ', 'ぜ', 'な', 'わ'];

  // De-inflection rule matrix (inflectedSuffix, lemmaSuffix, category, tag)
  const DEINFLECTION_RULES = [
    // --- I-Adjectives ---
    { suffix: 'くてさ', replace: 'い', type: 'adj-i', tag: 'te-form (caus)' },
    { suffix: 'くて', replace: 'い', type: 'adj-i', tag: 'te-form' },
    { suffix: 'かった', replace: 'い', type: 'adj-i', tag: 'past' },
    { suffix: 'くない', replace: 'い', type: 'adj-i', tag: 'negative' },
    { suffix: 'くなかった', replace: 'い', type: 'adj-i', tag: 'past negative' },
    { suffix: 'く', replace: 'い', type: 'adj-i', tag: 'adverbial' },
    { suffix: 'ければ', replace: 'い', type: 'adj-i', tag: 'conditional' },
    { suffix: 'さ', replace: 'い', type: 'adj-i', tag: 'noun-form' },
    { suffix: 'そう', replace: 'い', type: 'adj-i', tag: 'conjecture' },

    // --- Ichidan Verbs (e.g. 食べる, 見る) ---
    // Causative
    { suffix: 'させられる', replace: 'る', type: 'v1', tag: 'causative passive' },
    { suffix: 'させる', replace: 'る', type: 'v1', tag: 'causative' },
    { suffix: 'させた', replace: 'る', type: 'v1', tag: 'causative past' },
    { suffix: 'させ', replace: 'る', type: 'v1', tag: 'causative stem' },
    // Passive / Potential
    { suffix: 'られる', replace: 'る', type: 'v1', tag: 'passive/potential' },
    { suffix: 'られた', replace: 'る', type: 'v1', tag: 'passive past' },
    { suffix: 'られ', replace: 'る', type: 'v1', tag: 'passive stem' },
    { suffix: 'れる', replace: 'る', type: 'v1', tag: 'potential' },
    { suffix: 'れた', replace: 'る', type: 'v1', tag: 'potential past' },
    // Auxiliaries
    { suffix: 'てもらいたい', replace: 'る', type: 'v1', tag: 'want to have done' },
    { suffix: 'てもらって', replace: 'る', type: 'v1', tag: 'having done' },
    { suffix: 'てもらい', replace: 'る', type: 'v1', tag: 'have done' },
    { suffix: 'てもらう', replace: 'る', type: 'v1', tag: 'have done' },
    { suffix: 'てくれる', replace: 'る', type: 'v1', tag: 'do for me' },
    { suffix: 'てあげる', replace: 'る', type: 'v1', tag: 'do for someone' },
    { suffix: 'ておく', replace: 'る', type: 'v1', tag: 'do in advance' },
    { suffix: 'ている', replace: 'る', type: 'v1', tag: 'continuous' },
    { suffix: 'ていた', replace: 'る', type: 'v1', tag: 'continuous past' },
    { suffix: 'てる', replace: 'る', type: 'v1', tag: 'continuous (casual)' },
    { suffix: 'てた', replace: 'る', type: 'v1', tag: 'continuous past (casual)' },
    { suffix: 'てさ', replace: 'る', type: 'v1', tag: 'te-form' },
    { suffix: 'て', replace: 'る', type: 'v1', tag: 'te-form' },
    { suffix: 'た', replace: 'る', type: 'v1', tag: 'past' },
    { suffix: 'ないで', replace: 'る', type: 'v1', tag: 'negative te-form' },
    { suffix: 'なかった', replace: 'る', type: 'v1', tag: 'past negative' },
    { suffix: 'なくて', replace: 'る', type: 'v1', tag: 'negative te-form' },
    { suffix: 'ない', replace: 'る', type: 'v1', tag: 'negative' },
    { suffix: 'ず', replace: 'る', type: 'v1', tag: 'negative (classical)' },
    { suffix: 'ましょう', replace: 'る', type: 'v1', tag: 'polite volitional' },
    { suffix: 'ました', replace: 'る', type: 'v1', tag: 'polite past' },
    { suffix: 'ません', replace: 'る', type: 'v1', tag: 'polite negative' },
    { suffix: 'ます', replace: 'る', type: 'v1', tag: 'polite' },
    { suffix: 'よう', replace: 'る', type: 'v1', tag: 'volitional' },
    { suffix: 'れば', replace: 'る', type: 'v1', tag: 'conditional' },
    { suffix: 'ろ', replace: 'る', type: 'v1', tag: 'imperative' },
    { suffix: 'よ', replace: 'る', type: 'v1', tag: 'imperative' },

    // --- Godan Verbs (e.g. 思う, 行く, 話す, 待つ, 死ぬ, 飲む) ---
    // Te-form / Past with geminate consonant (っ)
    { suffix: 'った', replace: 'う', type: 'v5u', tag: 'past' },
    { suffix: 'った', replace: 'つ', type: 'v5t', tag: 'past' },
    { suffix: 'った', replace: 'る', type: 'v5r', tag: 'past' },
    { suffix: 'ってさ', replace: 'う', type: 'v5u', tag: 'te-form' },
    { suffix: 'ってさ', replace: 'つ', type: 'v5t', tag: 'te-form' },
    { suffix: 'ってさ', replace: 'る', type: 'v5r', tag: 'te-form' },
    { suffix: 'って', replace: 'う', type: 'v5u', tag: 'te-form' },
    { suffix: 'って', replace: 'つ', type: 'v5t', tag: 'te-form' },
    { suffix: 'って', replace: 'る', type: 'v5r', tag: 'te-form' },

    // Ku-verbs: 書く -> 書いて, 行く -> 行って
    { suffix: 'いた', replace: 'く', type: 'v5k', tag: 'past' },
    { suffix: 'いて', replace: 'く', type: 'v5k', tag: 'te-form' },
    // Gu-verbs: 泳ぐ -> 泳いで
    { suffix: 'いだ', replace: 'ぐ', type: 'v5g', tag: 'past' },
    { suffix: 'いで', replace: 'ぐ', type: 'v5g', tag: 'te-form' },

    // Mu/Nu/Bu verbs: 飲む -> 飲んで, 死ぬ -> 死んで, 遊ぶ -> 遊んで
    { suffix: 'んだ', replace: 'む', type: 'v5m', tag: 'past' },
    { suffix: 'んだ', replace: 'ぬ', type: 'v5n', tag: 'past' },
    { suffix: 'んだ', replace: 'ぶ', type: 'v5b', tag: 'past' },
    { suffix: 'んで', replace: 'む', type: 'v5m', tag: 'te-form' },
    { suffix: 'んで', replace: 'ぬ', type: 'v5n', tag: 'te-form' },
    { suffix: 'んで', replace: 'ぶ', type: 'v5b', tag: 'te-form' },

    // Su-verbs: 話す -> 話して, 話した
    { suffix: 'した', replace: 'す', type: 'v5s', tag: 'past' },
    { suffix: 'して', replace: 'す', type: 'v5s', tag: 'te-form' },

    // Negative forms (〜ない)
    { suffix: 'わない', replace: 'う', type: 'v5u', tag: 'negative' },
    { suffix: 'かない', replace: 'く', type: 'v5k', tag: 'negative' },
    { suffix: 'がない', replace: 'ぐ', type: 'v5g', tag: 'negative' },
    { suffix: 'さない', replace: 'す', type: 'v5s', tag: 'negative' },
    { suffix: 'たない', replace: 'つ', type: 'v5t', tag: 'negative' },
    { suffix: 'なない', replace: 'ぬ', type: 'v5n', tag: 'negative' },
    { suffix: 'ばない', replace: 'ぶ', type: 'v5b', tag: 'negative' },
    { suffix: 'まない', replace: 'む', type: 'v5m', tag: 'negative' },
    { suffix: 'らない', replace: 'る', type: 'v5r', tag: 'negative' },

    // Polite forms (〜ます)
    { suffix: 'います', replace: 'う', type: 'v5u', tag: 'polite' },
    { suffix: 'きます', replace: 'く', type: 'v5k', tag: 'polite' },
    { suffix: 'ぎます', replace: 'ぐ', type: 'v5g', tag: 'polite' },
    { suffix: 'します', replace: 'す', type: 'v5s', tag: 'polite' },
    { suffix: 'ちます', replace: 'つ', type: 'v5t', tag: 'polite' },
    { suffix: 'にます', replace: 'ぬ', type: 'v5n', tag: 'polite' },
    { suffix: 'びます', replace: 'ぶ', type: 'v5b', tag: 'polite' },
    { suffix: 'みます', replace: 'む', type: 'v5m', tag: 'polite' },
    { suffix: 'ります', replace: 'る', type: 'v5r', tag: 'polite' },

    // Potential forms (〜える)
    { suffix: 'える', replace: 'う', type: 'v5u', tag: 'potential' },
    { suffix: 'ける', replace: 'く', type: 'v5k', tag: 'potential' },
    { suffix: 'げる', replace: 'ぐ', type: 'v5g', tag: 'potential' },
    { suffix: 'せる', replace: 'す', type: 'v5s', tag: 'potential' },
    { suffix: 'てる', replace: 'つ', type: 'v5t', tag: 'potential' },
    { suffix: 'ねる', replace: 'ぬ', type: 'v5n', tag: 'potential' },
    { suffix: 'べる', replace: 'ぶ', type: 'v5b', tag: 'potential' },
    { suffix: 'める', replace: 'む', type: 'v5m', tag: 'potential' },
    { suffix: 'れる', replace: 'る', type: 'v5r', tag: 'potential' },

    // Causative forms (〜わせる)
    { suffix: 'わせる', replace: 'う', type: 'v5u', tag: 'causative' },
    { suffix: 'かせる', replace: 'く', type: 'v5k', tag: 'causative' },
    { suffix: 'がせる', replace: 'ぐ', type: 'v5g', tag: 'causative' },
    { suffix: 'たせる', replace: 'つ', type: 'v5t', tag: 'causative' },
    { suffix: 'なせる', replace: 'ぬ', type: 'v5n', tag: 'causative' },
    { suffix: 'ばせる', replace: 'ぶ', type: 'v5b', tag: 'causative' },
    { suffix: 'ませる', replace: 'む', type: 'v5m', tag: 'causative' },
    { suffix: 'らせる', replace: 'る', type: 'v5r', tag: 'causative' },

    // Passive forms (〜われる)
    { suffix: 'われる', replace: 'う', type: 'v5u', tag: 'passive' },
    { suffix: 'かれる', replace: 'く', type: 'v5k', tag: 'passive' },
    { suffix: 'がれる', replace: 'ぐ', type: 'v5g', tag: 'passive' },
    { suffix: 'たれる', replace: 'つ', type: 'v5t', tag: 'passive' },
    { suffix: 'なれる', replace: 'ぬ', type: 'v5n', tag: 'passive' },
    { suffix: 'ばれる', replace: 'ぶ', type: 'v5b', tag: 'passive' },
    { suffix: 'まれる', replace: 'む', type: 'v5m', tag: 'passive' },
    { suffix: 'られる', replace: 'る', type: 'v5r', tag: 'passive' },

    // --- Suru / Kuru Verbs ---
    { suffix: 'されている', replace: 'する', type: 'suru', tag: 'passive continuous' },
    { suffix: 'されている', replace: 'す', type: 'v5s', tag: 'passive continuous' },
    { suffix: 'される', replace: 'する', type: 'suru', tag: 'passive' },
    { suffix: 'させる', replace: 'する', type: 'suru', tag: 'causative' },
    { suffix: 'している', replace: 'する', type: 'suru', tag: 'continuous' },
    { suffix: 'していた', replace: 'する', type: 'suru', tag: 'continuous past' },
    { suffix: 'して', replace: 'する', type: 'suru', tag: 'te-form' },
    { suffix: 'した', replace: 'する', type: 'suru', tag: 'past' },
    { suffix: 'しない', replace: 'する', type: 'suru', tag: 'negative' },
    { suffix: 'します', replace: 'する', type: 'suru', tag: 'polite' },
    { suffix: 'こない', replace: 'くる', type: 'kuru', tag: 'negative' },
    { suffix: 'きます', replace: 'くる', type: 'kuru', tag: 'polite' },
    { suffix: 'きて', replace: 'くる', type: 'kuru', tag: 'te-form' },
    { suffix: 'きた', replace: 'くる', type: 'kuru', tag: 'past' }
  ];

  function deinflect(word) {
    if (!word || typeof word !== 'string') return [];
    const clean = word.trim();
    const results = [];

    // 0. Base lemma itself
    results.push({ lemma: clean, suffix: '', replace: '', tag: 'base', particle: '' });

    // 1. Strip trailing sentence particles
    const strippedCandidates = [{ stem: clean, particle: '' }];
    for (const p of TRAILING_PARTICLES) {
      if (clean.length > p.length && clean.endsWith(p)) {
        strippedCandidates.push({
          stem: clean.slice(0, -p.length),
          particle: p
        });
      }
    }

    // 2. Apply morphological de-inflection rules
    for (const { stem, particle } of strippedCandidates) {
      if (particle && stem.length > 0) {
        results.push({ lemma: stem, suffix: '', replace: '', tag: 'particle-stripped', particle });
      }

      for (const rule of DEINFLECTION_RULES) {
        if (stem.length > rule.suffix.length && stem.endsWith(rule.suffix)) {
          const baseStem = stem.slice(0, -rule.suffix.length);
          const candidateLemma = baseStem + rule.replace;

          results.push({
            lemma: candidateLemma,
            baseStem,
            suffix: rule.suffix,
            replace: rule.replace,
            tag: rule.tag,
            particle,
            type: rule.type
          });
        }
      }
    }

    return results;
  }

  const exportObj = {
    deinflect,
    TRAILING_PARTICLES,
    DEINFLECTION_RULES
  };

  if (typeof window !== 'undefined') {
    window.AnimeDeinflector = exportObj;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.AnimeDeinflector = exportObj;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
})();
