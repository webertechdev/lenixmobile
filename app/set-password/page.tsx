"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Smartphone, KeyRound } from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a session (arrived from invite link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // If no session, they might have arrived here directly without a link
        // We'll give them a moment to let Supabase process the hash from the URL
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (!retrySession) {
            toast.error("Invalid or expired invitation link.")
            router.push('/login')
          } else {
            setIsVerifying(false)
          }
        }, 1500)
      } else {
        setIsVerifying(false)
      }
    }
    checkSession()
  }, [supabase, router])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Password set successfully! Syncing your profile...")
        
        // Sync user to database to ensure roles are linked
        try {
          await fetch('/api/auth/sync-user', { method: 'POST' })
        } catch (syncErr) {
          console.error('Failed to sync user:', syncErr)
        }
        
        toast.success("Welcome to Lenix Mobile!")
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-slate-500">Verifying your invitation...</p>
      </div>
    )
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
            Complete Your Registration
          </p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" />
              Set Your Password
            </CardTitle>
            <CardDescription>
              Please choose a secure password for your new account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure account activation</span>
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
