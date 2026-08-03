import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return NextResponse.json({
      status: 'error',
      message: 'DATABASE_URL environment variable is not set',
      databaseConfigured: false,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }

  try {
    // Create a direct connection to test
    const sql = postgres(databaseUrl, {
      connect_timeout: 10,
      onnotice: () => {},
    });

    // Try a simple query
    const result = await sql`SELECT NOW()`;
    
    // Close the connection
    await sql.end();
    
    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      databaseConfigured: true,
      databaseUrl: databaseUrl.substring(0, 40) + '***',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Database health check error:', error);
    const errorMessage = error?.message || 'Unknown database error';
    const errorCode = error?.code || error?.name || 'UNKNOWN';
    
    // Provide specific suggestions based on error type
    let suggestions = [];
    if (errorCode === 'ENOTFOUND') {
      suggestions = [
        'Check that DATABASE_URL hostname is correct (should be from Supabase)',
        'Verify you\'re using the Transaction Mode connection string (port 6543)',
        'Ensure your Supabase project is active (not paused)',
      ];
    } else if (errorCode === 'ECONNREFUSED') {
      suggestions = [
        'Verify the database server is running',
        'Check that the port in DATABASE_URL is correct (usually 6543 for pooler)',
        'Ensure your IP address is whitelisted in Supabase firewall',
      ];
    } else if (errorCode === 'FATAL' || errorMessage.includes('password')) {
      suggestions = [
        'Verify your database password is correct',
        'Check that the username includes your project reference (postgres.[project-ref])',
        'Make sure you copied the entire connection string from Supabase',
      ];
    } else {
      suggestions = [
        'Verify DATABASE_URL is correct in your environment variables',
        'Check that the Supabase database server is running',
        'Try using the connection pooler URL instead of the direct connection URL',
      ];
    }

    return NextResponse.json({
      status: 'error',
      message: `Database connection failed: ${errorMessage}`,
      errorCode,
      databaseConfigured: true,
      databaseUrl: databaseUrl.substring(0, 40) + '***',
      suggestions,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
