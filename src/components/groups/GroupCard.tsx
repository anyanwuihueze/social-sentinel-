'use client';

import { Users, MessageSquare, Target } from 'lucide-react';

export default function GroupCard({ group, onToggleMonitoring, onLeaveGroup }: any) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">{group.group_name || 'Group'}</h3>
          <p className="text-sm text-gray-500">Joined: {new Date(group.joined_at).toLocaleDateString()}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${group.active ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
          {group.active ? 'Active' : 'Paused'}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center">
          <MessageSquare className="w-4 h-4 mx-auto mb-1" />
          <div className="font-bold">{group.today_stats?.messages_received || 0}</div>
          <div className="text-xs text-gray-500">Messages</div>
        </div>
        <div className="text-center">
          <MessageSquare className="w-4 h-4 mx-auto mb-1" />
          <div className="font-bold">{group.today_stats?.messages_replied || 0}</div>
          <div className="text-xs text-gray-500">Replied</div>
        </div>
        <div className="text-center">
          <Target className="w-4 h-4 mx-auto mb-1" />
          <div className="font-bold">{group.today_stats?.leads_generated || 0}</div>
          <div className="text-xs text-gray-500">Leads</div>
        </div>
      </div>
      
      <button className="w-full bg-gray-100 py-2 rounded text-sm">
        {group.active ? 'Pause Monitoring' : 'Resume Monitoring'}
      </button>
    </div>
  );
}
