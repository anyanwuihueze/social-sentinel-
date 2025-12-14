#!/usr/bin/env python3
"""
Telegram API Bridge - Connects using YOUR credentials
"""
import asyncio
import json
import sys
import os
import logging
from telethon import TelegramClient, events
from telethon.sessions import StringSession

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# === YOUR CREDENTIALS ===
API_ID = 36200987  # Your api_id
API_HASH = "062400eb954dcb12839fc4074eb2a1f7"  # Your api_hash
# ========================

# Session from environment
SESSION_STRING = os.getenv('TELEGRAM_SESSION_STRING', '')

if not SESSION_STRING:
    logger.error("TELEGRAM_SESSION_STRING environment variable is not set!")
    print(json.dumps({"type": "error", "message": "Session string missing. Run generate_session.py first."}))
    sys.exit(1)

class TelegramBridge:
    def __init__(self):
        self.client = None
        self.is_connected = False
        self.user_info = None
        
    async def connect(self):
        """Connect to Telegram using YOUR credentials"""
        try:
            logger.info(f"Connecting with API ID: {API_ID}")
            self.client = TelegramClient(
                StringSession(SESSION_STRING),
                API_ID,
                API_HASH,
                device_model="Social Sentinel Agent 1.0",
                system_version="Linux",
                app_version="1.0.0",
                timeout=30,
                connection_retries=3
            )
            
            # Setup event handler for new messages
            @self.client.on(events.NewMessage)
            async def message_handler(event):
                await self.handle_new_message(event)
            
            # Connect
            await self.client.start()
            self.is_connected = True
            self.user_info = await self.client.get_me()
            
            # Save updated session if changed
            new_session = self.client.session.save()
            if new_session != SESSION_STRING:
                print(json.dumps({
                    "type": "session_update",
                    "session_string": new_session
                }))
                sys.stdout.flush()
            
            # Send connection success
            print(json.dumps({
                "type": "status",
                "status": "connected",
                "user": self.user_info.username or f"User {self.user_info.id}",
                "user_id": self.user_info.id
            }))
            sys.stdout.flush()
            
            logger.info(f"Connected as: {self.user_info.username} (ID: {self.user_info.id})")
            return True
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            print(json.dumps({
                "type": "error",
                "message": str(e)
            }))
            sys.stdout.flush()
            return False
    
    async def handle_new_message(self, event):
        """Process incoming messages"""
        try:
            if not event.message or not event.message.text:
                return
                
            message_data = {
                "type": "new_message",
                "id": event.message.id,
                "text": event.message.text,
                "sender_id": event.message.sender_id,
                "chat_id": event.chat_id,
                "timestamp": event.message.date.isoformat() if event.message.date else None
            }
            
            # Try to get chat title
            try:
                if hasattr(event.chat, 'title'):
                    message_data["chat_title"] = event.chat.title
                elif hasattr(event.chat, 'username'):
                    message_data["chat_title"] = event.chat.username
            except:
                pass
            
            print(json.dumps(message_data))
            sys.stdout.flush()
            
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def send_message(self, chat_id, text):
        """Send a message to a chat"""
        try:
            await self.client.send_message(int(chat_id), text)
            print(json.dumps({
                "type": "message_sent",
                "chat_id": chat_id,
                "text": text[:100] + "..." if len(text) > 100 else text
            }))
            sys.stdout.flush()
            return True
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            return False
    
    async def join_group(self, invite_link):
        """Join a group via invite link"""
        try:
            result = await self.client.join_chat(invite_link)
            print(json.dumps({
                "type": "joined_group",
                "group": result.title if hasattr(result, 'title') else "Unknown",
                "invite_link": invite_link
            }))
            sys.stdout.flush()
            return True
        except Exception as e:
            logger.error(f"Failed to join group: {e}")
            return False
    
    async def monitor(self):
        """Main monitoring loop"""
        if await self.connect():
            print(json.dumps({"type": "ready"}))
            sys.stdout.flush()
            await self.client.run_until_disconnected()
        else:
            logger.error("Failed to connect")

async def handle_commands(bridge):
    """Handle commands from stdin (Node.js)"""
    while True:
        try:
            line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
            if not line:
                break
                
            line = line.strip()
            if line:
                try:
                    command = json.loads(line)
                    cmd_type = command.get("type")
                    
                    if cmd_type == "send_message" and bridge.is_connected:
                        asyncio.create_task(bridge.send_message(
                            command["chat_id"],
                            command["text"]
                        ))
                    elif cmd_type == "join_group" and bridge.is_connected:
                        asyncio.create_task(bridge.join_group(
                            command["invite_link"]
                        ))
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON: {e}")
                    
        except Exception as e:
            logger.error(f"Error reading stdin: {e}")
            break

async def main():
    """Main async entry point"""
    bridge = TelegramBridge()
    
    # Start bridge and command handler
    await asyncio.gather(
        bridge.monitor(),
        handle_commands(bridge)
    )

if __name__ == "__main__":
    asyncio.run(main())
