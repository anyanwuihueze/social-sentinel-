const Sentiment = require('sentiment');
const analyzer = new Sentiment();

const score = (text) => {
  const r = analyzer.analyze(text);
  return r.score;
};

module.exports = { score };
