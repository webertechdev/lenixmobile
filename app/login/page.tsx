"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Smartphone, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        // Sync user to database
        try {
          const syncResponse = await fetch('/api/auth/sync-user', { method: 'POST' })
          const syncData = await syncResponse.json()
          
          if (syncData.user?.isFirstUser) {
            toast.success(`Welcome, ${syncData.user.name}! You have been set up as admin.`)
          } else if (syncResponse.ok) {
            toast.success(`Welcome back${syncData.user?.role === 'admin' ? ', Admin' : ''}!`)
          } else {
            toast.warning('Database sync issue. Please contact support.')
          }
        } catch (syncErr) {
          console.error('Failed to sync user:', syncErr)
          toast.success('Signed in successfully!')
        }
        
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 mb-2">
            <Smartphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Lenix <span className="text-primary">Mobile</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Aftersales Management System
          </p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Access your technician dashboard and manage repairs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="px-0 font-normal text-xs h-auto" type="button">
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure production environment</span>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} Lenix Mobile. All rights reserved.
        </p>
      </div>
    </div>
  )
}
