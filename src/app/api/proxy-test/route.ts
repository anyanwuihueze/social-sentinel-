import { NextResponse } from 'next/server';
import { ProxyAgent } from 'undici';
import { fetch as undiciFetch } from 'undici';

export async function POST(req: Request) {
  const { proxyUrl } = await req.json();
  
  if (!proxyUrl) {
    return NextResponse.json({ status: 'disconnected', ip: null });
  }
  
  try {
    const proxyAgent = new ProxyAgent(proxyUrl);
    
    const res = await undiciFetch('https://api.ipify.org?format=json', {
      dispatcher: proxyAgent
    });
    
    const data = await res.json() as { ip: string };
    
    return NextResponse.json({ 
      status: 'ok', 
      ip: data.ip, 
      proxyUrl,
      expectedProxyIp: '45.151.89.164',
      proxyWorking: data.ip === '45.151.89.164'
    });
  } catch (e: any) {
    return NextResponse.json({ 
      status: 'fail', 
      error: e.message, 
      errorDetails: e.cause?.message || 'Unknown error',
      proxyUrl 
    });
  }
}
