const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const path = require('path');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class GroupManager {
  constructor() {
    this.activeGroups = new Map();
  }

  // 1. Join group by invite link
  async joinGroup(inviteLink) {
    return new Promise((resolve, reject) => {
      console.log(`Joining group with invite link: ${inviteLink}`);
      
      const pythonProcess = spawn('/opt/venv/bin/python3', [
        path.join(__dirname, 'telegram-utils.py'),
        'join_group',
        inviteLink
      ], {
        env: { ...process.env, PATH: '/opt/venv/bin:' + process.env.PATH }
      });

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0 && result) {
          try {
            const groupData = JSON.parse(result);
            
            if (groupData.error) {
              reject(groupData.error);
              return;
            }
            
            // Save to database
            const { data, error: dbError } = await supabase
              .from('monitored_groups')
              .upsert({
                group_id: groupData.id.toString(),
                group_name: groupData.title,
                group_username: groupData.username,
                invite_link: inviteLink,
                participant_count: groupData.participant_count,
                active: true,
                joined_at: new Date().toISOString()
              })
              .select()
              .single();

            if (dbError) {
              console.error('Database error:', dbError);
              reject(dbError.message);
              return;
            }
            
            console.log(`Successfully joined group: ${groupData.title}`);
            resolve({
              success: true,
              group: data
            });
          } catch (parseError) {
            console.error('Parse error:', parseError);
            reject(`Failed to parse response: ${parseError.message}`);
          }
        } else {
          reject(`Failed to join group: ${error || 'Unknown error'}`);
        }
      });
    });
  }

  // 2. List monitored groups
  async listGroups(activeOnly = true) {
    try {
      let query = supabase
        .from('monitored_groups')
        .select('*')
        .order('joined_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Get today's stats for each group
      const today = new Date().toISOString().split('T')[0];
      const groupsWithStats = await Promise.all(
        data.map(async (group) => {
          try {
            const { data: stats } = await supabase
              .from('group_stats')
              .select('*')
              .eq('group_id', group.group_id)
              .eq('date', today)
              .single();

            return {
              ...group,
              today_stats: stats || {
                messages_received: 0,
                messages_replied: 0,
                leads_generated: 0,
                keywords_triggered: {}
              }
            };
          } catch (err) {
            return {
              ...group,
              today_stats: {
                messages_received: 0,
                messages_replied: 0,
                leads_generated: 0,
                keywords_triggered: {}
              }
            };
          }
        })
      );

      return groupsWithStats;
    } catch (error) {
      console.error('Error listing groups:', error);
      throw error;
    }
  }

  // 3. Leave group
  async leaveGroup(groupId) {
    return new Promise((resolve, reject) => {
      console.log(`Leaving group ID: ${groupId}`);
      
      const pythonProcess = spawn('/opt/venv/bin/python3', [
        path.join(__dirname, 'telegram-utils.py'),
        'leave_group',
        groupId.toString()
      ], {
        env: { ...process.env, PATH: '/opt/venv/bin:' + process.env.PATH }
      });

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0 && result) {
          try {
            const leaveResult = JSON.parse(result);
            
            if (!leaveResult.success) {
              reject(leaveResult.error || 'Failed to leave group');
              return;
            }
            
            // Update database
            const { data, error: dbError } = await supabase
              .from('monitored_groups')
              .update({ 
                active: false,
                left_at: new Date().toISOString()
              })
              .eq('group_id', groupId)
              .select()
              .single();

            if (dbError) {
              console.error('Database error:', dbError);
              reject(dbError.message);
              return;
            }
            
            console.log(`Successfully left group ID: ${groupId}`);
            resolve({
              success: true,
              group: data
            });
          } catch (parseError) {
            console.error('Parse error:', parseError);
            reject(`Failed to parse response: ${parseError.message}`);
          }
        } else {
          reject(`Failed to leave group: ${error || 'Unknown error'}`);
        }
      });
    });
  }

  // 4. Pause/resume group monitoring
  async toggleGroupMonitoring(groupId, active) {
    try {
      const { data, error } = await supabase
        .from('monitored_groups')
        .update({ active })
        .eq('group_id', groupId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log(`Group ${groupId} monitoring set to: ${active ? 'active' : 'paused'}`);
      return {
        success: true,
        group: data
      };
    } catch (error) {
      console.error('Error toggling monitoring:', error);
      throw error;
    }
  }

  // 5. Update group stats
  async updateGroupStats(groupId, statsUpdate) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get existing stats or create new
      const { data: existing, error: fetchError } = await supabase
        .from('group_stats')
        .select('*')
        .eq('group_id', groupId)
        .eq('date', today)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching stats:', fetchError);
        throw fetchError;
      }

      if (existing) {
        // Update existing stats (increment values)
        const updatedStats = {
          messages_received: (existing.messages_received || 0) + (statsUpdate.messages_received || 0),
          messages_replied: (existing.messages_replied || 0) + (statsUpdate.messages_replied || 0),
          leads_generated: (existing.leads_generated || 0) + (statsUpdate.leads_generated || 0),
          keywords_triggered: {
            ...(existing.keywords_triggered || {}),
            ...(statsUpdate.keywords_triggered || {})
          },
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('group_stats')
          .update(updatedStats)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new stats entry
        const newStats = {
          group_id: groupId,
          date: today,
          messages_received: statsUpdate.messages_received || 0,
          messages_replied: statsUpdate.messages_replied || 0,
          leads_generated: statsUpdate.leads_generated || 0,
          keywords_triggered: statsUpdate.keywords_triggered || {},
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('group_stats')
          .insert(newStats)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error updating group stats:', error);
      // Don't throw - we don't want to break message processing
      return null;
    }
  }

  // 6. Get group statistics
  async getGroupStats(groupId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('group_stats')
        .select('*')
        .eq('group_id', groupId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting group stats:', error);
      return [];
    }
  }
}

module.exports = GroupManager;
