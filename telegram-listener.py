import os, sys, json, asyncio, traceback
from telethon import TelegramClient, events
from telethon.sessions import StringSession
import aiohttp

# Add comprehensive error logging
def log_error(msg, exc=None):
    print(f"[ERROR] {msg}", file=sys.stderr)
    if exc:
        traceback.print_exc(file=sys.stderr)

# Validate environment
API_ID = 36200987
API_HASH = "062400eb954dcb12839fc4074eb2a1f7"
SESSION = os.getenv('TELEGRAM_SESSION_STRING', '')

if not SESSION:
    log_error("TELEGRAM_SESSION_STRING environment variable is empty or not set")
    print(json.dumps({'type': 'error', 'msg': 'Missing session string'}), flush=True)
    sys.exit(1)

print(f"[INFO] Session string length: {len(SESSION)}", file=sys.stderr)

try:
    client = TelegramClient(StringSession(SESSION), API_ID, API_HASH)
    print("[INFO] TelegramClient created successfully", file=sys.stderr)
except Exception as e:
    log_error(f"Failed to create TelegramClient: {e}", e)
    print(json.dumps({'type': 'error', 'msg': f'Client creation failed: {str(e)}'}), flush=True)
    sys.exit(1)

# [Rest of your original code remains the same]
async def update_group_stats(chat_id, stats_data):
    """Update group statistics in the backend"""
    try:
        api_url = os.getenv('API_BASE_URL', 'http://localhost:3001')
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{api_url}/api/groups/{chat_id}/stats",
                json=stats_data,
                timeout=5
            ) as response:
                if response.status != 200:
                    print(f"Failed to update stats: {response.status}", file=sys.stderr)
    except Exception as e:
        print(f"Error updating stats: {e}", file=sys.stderr)

async def main():
    try:
        print("[INFO] Starting Telegram client...", file=sys.stderr)
        await client.start()
        print(json.dumps({'type': 'ready', 'status': 'connected'}), flush=True)
        print("[INFO] Telegram client started successfully", file=sys.stderr)
        
        @client.on(events.NewMessage)
        async def handler(event):
            if event.chat_id >= 0:
                return
            
            sender_username = None
            try:
                sender = await event.get_sender()
                sender_username = getattr(sender, 'username', None)
            except:
                pass
            
            msg = {
                'type': 'message',
                'chat_id': event.chat_id,
                'sender_id': event.sender_id,
                'sender_username': sender_username,
                'text': event.message.text or '',
                'date': event.date.isoformat()
            }
            print(json.dumps(msg), flush=True)
            
            try:
                await update_group_stats(str(event.chat_id), {'messages_received': 1})
            except:
                pass
        
        async def stdin_reader():
            loop = asyncio.get_event_loop()
            while True:
                line = await loop.run_in_executor(None, sys.stdin.readline)
                if not line:
                    break
                try:
                    cmd = json.loads(line.strip())
                    if cmd['action'] == 'send':
                        await client.send_message(cmd['chat_id'], cmd['text'])
                        print(json.dumps({'type': 'sent', 'ok': True}), flush=True)
                except Exception as e:
                    print(json.dumps({'type': 'error', 'msg': str(e)}), flush=True)
        
        await asyncio.gather(
            client.run_until_disconnected(),
            stdin_reader()
        )
    except Exception as e:
        log_error(f"Main loop failed: {e}", e)
        print(json.dumps({'type': 'error', 'msg': str(e)}), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())