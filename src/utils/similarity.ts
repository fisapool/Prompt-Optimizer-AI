export function cosineSimilarity(text1: string, text2: string): number {
  // Convert texts to lowercase and split into words
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  // Create word frequency maps
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  // Count word frequencies
  words1.forEach(word => {
    freq1.set(word, (freq1.get(word) || 0) + 1);
  });

  words2.forEach(word => {
    freq2.set(word, (freq2.get(word) || 0) + 1);
  });

  // Get all unique words
  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach(word => {
    const f1 = freq1.get(word) || 0;
    const f2 = freq2.get(word) || 0;
    dotProduct += f1 * f2;
    magnitude1 += f1 * f1;
    magnitude2 += f2 * f2;
  });

  // Calculate cosine similarity
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
} 