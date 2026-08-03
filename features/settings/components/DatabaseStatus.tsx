"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw, Database } from "lucide-react";

export function DatabaseStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setStatus(data);
    } catch (error: any) {
      setStatus({
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const isConnected = status?.status === "ok";
  const isConfigured = status?.databaseConfigured;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Database Connection</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>Monitor your database connection status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? (
          <>
            <div className="flex items-start gap-3">
              {isConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{status.message}</p>
                {status.errorCode && (
                  <p className="text-sm text-muted-foreground">Error Code: {status.errorCode}</p>
                )}
              </div>
            </div>

            {status.databaseUrl && (
              <div className="p-3 bg-slate-50 rounded-lg border">
                <p className="text-xs font-mono text-muted-foreground">{status.databaseUrl}</p>
              </div>
            )}

            {status.suggestions && status.suggestions.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-sm text-yellow-900 mb-2">Suggestions:</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {status.suggestions.map((suggestion: string, idx: number) => (
                    <li key={idx} className="flex gap-2">
                      <span>•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Last checked: {new Date(status.timestamp).toLocaleString()}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}

        <Button onClick={testConnection} disabled={loading} className="w-full">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Testing..." : "Test Connection"}
        </Button>
      </CardContent>
    </Card>
  );
}
