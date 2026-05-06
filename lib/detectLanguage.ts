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
];

export function detectLanguage(text: string): "fr" | "en" {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let frenchCount = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-zàâäéèêëîïôùûüç]/g, "");
    if (FRENCH_MARKERS.includes(clean)) {
      frenchCount++;
    }
  }

  // If more than 1 French marker found, treat as French
  return frenchCount > 1 ? "fr" : "en";
}