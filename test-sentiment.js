function analyzeSentiment(text) {
  const negativeWords = ['denied', 'rejected', 'frustrated', 'confused', 'stuck', 'failed'];
  const positiveWords = ['approved', 'success', 'thanks', 'helpful'];
  
  let score = 0;
  const lower = text.toLowerCase();
  
  negativeWords.forEach(word => { if (lower.includes(word)) score -= 0.2; });
  positiveWords.forEach(word => { if (lower.includes(word)) score += 0.2; });
  
  return Math.max(-1, Math.min(1, score));
}

const testMessages = [
  { text: "Visa denied, so frustrated!", expected: "negative" },
  { text: "Thanks! My visa was approved!", expected: "positive" },
  { text: "Need help with appointment", expected: "neutral" }
];

testMessages.forEach(({text, expected}) => {
  const score = analyzeSentiment(text);
  const actual = score < -0.3 ? "negative" : score > 0.3 ? "positive" : "neutral";
  console.log(`\n"${text}"`);
  console.log(`  Score: ${score.toFixed(2)}`);
  console.log(`  Expected: ${expected}, Actual: ${actual}`);
  console.log(`  Would reply: ${score < -0.3 ? '✅ YES (frustrated)' : '⏭️ NO (not frustrated enough)'}`);
});
