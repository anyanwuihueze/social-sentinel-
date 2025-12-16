#!/usr/bin/env python3
import sys
import json
import asyncio
from telethon import TelegramClient
from telethon.errors import FloodWaitError, InviteHashInvalidError, ChannelPrivateError
from telethon.sessions import StringSession
import os

# Telegram credentials from environment
API_ID = int(os.getenv('TELEGRAM_API_ID', 36200987))
API_HASH = os.getenv('TELEGRAM_API_HASH', "062400eb954dcb12839fc4074eb2a1f7")
SESSION = os.getenv('TELEGRAM_SESSION_STRING', '')

client = TelegramClient(StringSession(SESSION), API_ID, API_HASH)

async def join_group_by_invite(invite_link):
    """Join a Telegram group using an invite link"""
    try:
        print(f"Attempting to join: {invite_link}", file=sys.stderr)
        
        if not await client.is_user_authorized():
            print("Starting client...", file=sys.stderr)
            await client.start()
        
        # Join the group
        try:
            group_entity = await client.get_entity(invite_link)
        except ValueError:
            # If it's a username without @
            if not invite_link.startswith('@'):
                invite_link = '@' + invite_link
            group_entity = await client.get_entity(invite_link)
        
        # Get participant count
        try:
            participants = await client.get_participants(group_entity, limit=1)
            participant_count = len(await client.get_participants(group_entity))
        except:
            participant_count = 0
        
        result = {
            'id': group_entity.id,
            'title': getattr(group_entity, 'title', 'Unknown Group'),
            'username': getattr(group_entity, 'username', None),
            'participant_count': participant_count,
            'joined': True
        }
        
        print(f"Successfully joined: {result['title']}", file=sys.stderr)
        return result
        
    except InviteHashInvalidError:
        return {'error': 'Invalid invite link'}
    except FloodWaitError as e:
        return {'error': f'Flood wait: {e.seconds} seconds'}
    except ChannelPrivateError:
        return {'error': 'Channel is private or you need to join first'}
    except Exception as e:
        print(f"Error joining group: {e}", file=sys.stderr)
        return {'error': str(e)}

async def leave_group(group_id):
    """Leave a Telegram group"""
    try:
        group_entity = await client.get_entity(int(group_id))
        await client.delete_dialog(group_entity)
        
        return {
            'success': True,
            'group_id': group_id,
            'left': True
        }
        
    except Exception as e:
        print(f"Error leaving group: {e}", file=sys.stderr)
        return {'error': str(e), 'success': False}

async def list_joined_groups():
    """List all groups/dialogs we're in"""
    try:
        if not await client.is_user_authorized():
            await client.start()
            
        groups = []
        async for dialog in client.iter_dialogs():
            if dialog.is_group:
                try:
                    group = await client.get_entity(dialog.id)
                    group_data = {
                        'id': group.id,
                        'title': getattr(group, 'title', 'Unknown'),
                        'username': getattr(group, 'username', None),
                        'participant_count': getattr(group, 'participant_count', 0),
                        'last_message': dialog.date.isoformat() if dialog.date else None
                    }
                    groups.append(group_data)
                except:
                    continue
        
        return {'groups': groups}
        
    except Exception as e:
        print(f"Error listing groups: {e}", file=sys.stderr)
        return {'error': str(e)}

async def main():
    command = sys.argv[1]
    
    async with client:
        if command == 'join_group':
            invite_link = sys.argv[2]
            result = await join_group_by_invite(invite_link)
            print(json.dumps(result))
            
        elif command == 'leave_group':
            group_id = sys.argv[2]
            result = await leave_group(group_id)
            print(json.dumps(result))
            
        elif command == 'list_groups':
            result = await list_joined_groups()
            print(json.dumps(result))

if __name__ == '__main__':
    asyncio.run(main())
