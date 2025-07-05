import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { syncUserFromClerk } from '@/lib/user-sync';
export default async function Profile() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/');
    }
    const clerkUser = await currentUser();
    if (!clerkUser) {
        redirect('/');
    }
    // Sync user with our database
    const user = await syncUserFromClerk();
    if (!user) {
        redirect('/');
    }
    return (<div className="min-h-screen bg-gradient-to-br from-background to-card">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <MapPin className="h-6 w-6 text-primary"/>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Pathly
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hover:bg-primary/10" asChild>
              <a href="/dashboard">Dashboard</a>
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Profile Settings</h2>
          <p className="text-muted-foreground">Manage your account information and preferences.</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Personal Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Update your profile information to help us provide better transit recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={user.firstName || ''} disabled className="bg-muted"/>
                <p className="text-xs text-muted-foreground">Managed by your account provider</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={user.lastName || ''} disabled className="bg-muted"/>
                <p className="text-xs text-muted-foreground">Managed by your account provider</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled className="bg-muted"/>
              <p className="text-xs text-muted-foreground">Managed by your account provider</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input id="university" placeholder="e.g., University of Toronto" value={user.university || ''}/>
              <p className="text-xs text-muted-foreground">
                Help us provide campus-specific transit information
              </p>
            </div>

            <div className="pt-4">
              <Button className="bg-accent hover:bg-accent/80 text-accent-foreground">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Safety Preferences</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure your safety and route preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Prioritize well-lit routes</p>
                <p className="text-sm text-muted-foreground">Prefer routes with better lighting during evening hours</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Avoid isolated stops</p>
                <p className="text-sm text-muted-foreground">Skip transit stops with low foot traffic</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weather alerts</p>
                <p className="text-sm text-muted-foreground">Get notifications about weather impact on transit</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>);
}
