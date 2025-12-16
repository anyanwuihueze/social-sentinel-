'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

export default function KeywordManager() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://social-agents-1765342327.fly.dev/api/keywords')
      .then(res => res.json())
      .then(data => {
        if (data.success) setKeywords(data.keywords || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-2xl font-bold mb-4">Keyword Manager</h2>
      {loading ? (
        <p>Loading keywords...</p>
      ) : (
        <div className="space-y-2">
          {keywords.map((kw, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded flex justify-between">
              <span>{kw}</span>
              <button><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
