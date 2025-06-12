'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, CheckCircle, XCircle, User } from 'lucide-react';

interface SearchResult {
  found: boolean;
  message: string;
  contact?: {
    id: string;
    email: string;
    name: string;
  };
}

export function ContactSearchForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/search-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/80 shadow-xl border-0 ring-1 ring-black/5">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Contact Search
            </CardTitle>
            <CardDescription className="text-gray-600">
              Search for contacts in GoHighLevel and update their referral status
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter contact email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Contact
                    </>
                  )}
                </Button>
                
                {(result || error) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="h-11 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className={`border-${result.found ? 'green' : 'yellow'}-200 bg-${result.found ? 'green' : 'yellow'}-50`}>
                {result.found ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <User className="h-4 w-4 text-yellow-500" />
                )}
                <AlertDescription className={`text-${result.found ? 'green' : 'yellow'}-700`}>
                  <div className="space-y-1">
                    <p className="font-medium">{result.message}</p>
                    {result.contact && (
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {result.contact.name}</p>
                        <p><span className="font-medium">Email:</span> {result.contact.email}</p>
                        <p><span className="font-medium">ID:</span> {result.contact.id}</p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Enter an email address to search for existing contacts</p>
          <p className="mt-1">Successfully found contacts will have their referral code updated</p>
        </div>
      </div>
    </div>
  );
}