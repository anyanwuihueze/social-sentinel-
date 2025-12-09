import Sentiment from 'sentiment';
const analyzer = new Sentiment();

export const score = (text: string): number => {
  const r = analyzer.analyze(text);
  return r.score;           // -5 .. 5
};
