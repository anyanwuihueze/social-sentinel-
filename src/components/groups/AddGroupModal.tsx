'use client';

import { useState } from 'react';
import { X, Link } from 'lucide-react';

export default function AddGroupModal({ isOpen, onClose, onGroupAdded }: any) {
  const [inviteLink, setInviteLink] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            <h2 className="text-xl font-bold">Add Telegram Group</h2>
          </div>
          <button onClick={onClose}><X /></button>
        </div>
        <input
          type="text"
          placeholder="Paste invite link..."
          className="w-full p-3 border rounded mb-4"
          value={inviteLink}
          onChange={(e) => setInviteLink(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Join Group
        </button>
      </div>
    </div>
  );
}
