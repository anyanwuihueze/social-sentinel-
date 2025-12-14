import os, sys, json, asyncio
from telethon import TelegramClient, events
from telethon.sessions import StringSession

API_ID = 36200987
API_HASH = "062400eb954dcb12839fc4074eb2a1f7"
SESSION = os.getenv('TELEGRAM_SESSION_STRING', '')

client = TelegramClient(StringSession(SESSION), API_ID, API_HASH)

async def main():
    try:
        await client.start()
        print(json.dumps({'type': 'ready', 'status': 'connected'}), flush=True)
        
        @client.on(events.NewMessage)
        async def handler(event):
            # Get sender info
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
        print(json.dumps({'type': 'error', 'msg': str(e)}), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())