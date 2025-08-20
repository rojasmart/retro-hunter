import { NextRequest } from 'next/server';

// Debug para verificar variáveis no Next.js
export async function GET(request: NextRequest) {
  console.log('=== DEBUG VARIÁVEIS NO NEXT.JS ===');
  console.log('EBAY_CLIENT_ID:', process.env.EBAY_CLIENT_ID ? '✅ Definido' : '❌ Não definido');
  console.log('EBAY_CLIENT_SECRET:', process.env.EBAY_CLIENT_SECRET ? '✅ Definido' : '❌ Não definido');
  console.log('EBAY_ACCESS_TOKEN:', process.env.EBAY_ACCESS_TOKEN ? '✅ Definido' : '❌ Não definido');
  console.log('EBAY_SANDBOX:', process.env.EBAY_SANDBOX);
  
  // Teste de geração de token
  try {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const isSandbox = process.env.EBAY_SANDBOX === 'true';

    if (!clientId || !clientSecret) {
      return Response.json({ 
        error: 'EBAY_CLIENT_ID e EBAY_CLIENT_SECRET são obrigatórios',
        env: {
          CLIENT_ID: !!process.env.EBAY_CLIENT_ID,
          CLIENT_SECRET: !!process.env.EBAY_CLIENT_SECRET,
          SANDBOX: process.env.EBAY_SANDBOX
        }
      }, { status: 500 });
    }

    const baseUrl = isSandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
    const tokenUrl = `${baseUrl}/identity/v1/oauth2/token`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('🔗 Solicitando token:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao obter token:', errorText);
      return Response.json({ 
        error: 'Erro ao obter token', 
        details: errorText,
        status: response.status
      }, { status: 500 });
    }

    const tokenData = await response.json();
    console.log('✅ Token obtido:', tokenData.access_token.substring(0, 30) + '...');

    // Testar API com token
    const apiUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=laptop&limit=1`;
    const testResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      return Response.json({
        success: true,
        message: 'Token e API funcionando!',
        total: testData.total || 0,
        items: testData.itemSummaries?.length || 0,
        firstItem: testData.itemSummaries?.[0]?.title || 'Nenhum item'
      });
    } else {
      const errorData = await testResponse.text();
      return Response.json({ 
        error: 'Erro na API do eBay', 
        details: errorData,
        status: testResponse.status 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
