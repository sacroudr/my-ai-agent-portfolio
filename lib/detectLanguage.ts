/**
 * Detects whether a message is French or English.
 * Uses a simple but effective heuristic: count French-specific words.
 * Falls back to English if uncertain.
 */

const FRENCH_MARKERS = [
  // Common French words that don't appear in English
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles",
  "est", "sont", "avoir", "être", "faire", "quel", "quelle",
  "quels", "quelles", "que", "qui", "quoi", "comment", "pourquoi",
  "bonjour", "salut", "merci", "oui", "non", "avec", "pour",
  "dans", "sur", "par", "une", "les", "des", "ses", "mes",
  "ton", "son", "notre", "votre", "leur", "leurs",
  "mais", "donc", "alors", "aussi", "très", "plus", "moins",
  "parle", "parler", "sais", "savoir", "peux", "peut", "veux",
  "veut", "connais", "connaît", "travail", "compétences",
  "expérience", "disponible", "pouvez", "avez", "êtes",
  "habite", "cherche", "recherche", "diplôme", "formation",
  "montre", "montrer", "montrez", "présente", "où",
  "ce", "cette", "ces", "mon", "ma", "tes", "déployé", "déployer",
];

export function detectLanguage(text: string): "fr" | "en" {
  const lowerText = text.toLowerCase();
  // Split on whitespace, hyphens, and apostrophes so contractions and
  // inversions like "as-tu", "qu'est-ce", or "peux-tu" break into their
  // component words instead of being treated as a single unmatched token.
  const words = lowerText.split(/[\s'’\-]+/);

  let frenchCount = 0;
  let accentCount = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-zàâäéèêëîïôùûüç]/g, "");
    if (!clean) continue;
    if (FRENCH_MARKERS.includes(clean)) frenchCount++;
    // Accented letters are a strong French signal — but a single one is not
    // enough (English loanwords like "résumé"/"café" carry accents too).
    if (/[àâäéèêëîïôùûüç]/.test(clean)) accentCount++;
  }

  // French if: more than one marker, OR an accented word backed by a marker,
  // OR multiple accented words (which English queries almost never have).
  if (frenchCount > 1) return "fr";
  if (accentCount >= 1 && frenchCount >= 1) return "fr";
  if (accentCount >= 2) return "fr";
  return "en";
}