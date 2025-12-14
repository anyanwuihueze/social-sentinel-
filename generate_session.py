#!/usr/bin/env python3
"""
ONE-TIME Telegram Session Generator
Run this locally on your laptop to create a session string.
"""
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession

async def main():
    print("=== Telegram Session Generator ===")
    print("Using YOUR credentials:")
    print("api_id: 36200987")
    print("api_hash: 062400eb954dcb12839fc4074eb2a1f7\n")
    
    # YOUR CREDENTIALS HARDCODED
    api_id = 36200987
    api_hash = "062400eb954dcb12839fc4074eb2a1f7"
    
    print("📱 A login prompt will appear.")
    print("   Use the PHONE NUMBER for your agent's account.")
    print("   Example: +1234567890\n")
    
    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.start()
    
    session_string = client.session.save()
    
    print("\n" + "="*60)
    print("✅ SUCCESS! Your session string is:")
    print("="*60)
    print(session_string)
    print("="*60)
    
    print("\n🔐 Add this to Fly.io secrets:")
    print(f'fly secrets set TELEGRAM_SESSION_STRING="{session_string}" --app social-agents-1765342327')
    
    print("\n📝 Your API credentials are already in the code.")
    
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
