const keywords = ['visa', 'interview', 'appointment', 'embassy', 'denied', 'rejected', 'passport'];
const testMessages = [
  "My passport is expiring, need visa help",
  "When is my embassy appointment?",
  "Feeling happy about my travel plans",
  "Visa denied twice, so frustrated",
  "Need help with schengen visa application"
];

console.log("🧪 Testing keyword detection:");
testMessages.forEach(msg => {
  const lower = msg.toLowerCase();
  const found = keywords.filter(k => lower.includes(k));
  console.log(`\n"${msg}"`);
  console.log(`  Contains keywords: ${found.length > 0 ? '✅' : '❌'}`);
  if (found.length > 0) console.log(`  Found: ${found.join(', ')}`);
});
