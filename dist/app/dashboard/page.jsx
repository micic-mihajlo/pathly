import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, MessageSquare, Shield, Users, Sparkles, TrendingUp } from 'lucide-react';
import { syncUserFromClerk } from '@/lib/user-sync';
import UniversitySetup from '@/components/university-setup';
export default async function Dashboard() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/');
    }
    // Sync user with our database
    const user = await syncUserFromClerk();
    if (!user) {
        redirect('/');
    }
    // Show university setup if not completed
    if (!user.university) {
        return (<div className="min-h-screen bg-gradient-to-br from-background to-card flex items-center justify-center">
        <UniversitySetup />
      </div>);
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
              <a href="/profile">Profile</a>
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Sparkles className="h-8 w-8 text-primary mr-3"/>
            <h2 className="text-4xl font-bold text-foreground">
              Welcome back{user.firstName ? `, ${user.firstName}` : ''}!
            </h2>
          </div>
          <p className="text-xl text-muted-foreground">Your transit companion is ready to help you navigate safely.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader className="pb-3 text-center">
              <div className="mx-auto mb-3 p-3 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <MapPin className="h-6 w-6 text-primary"/>
              </div>
              <CardTitle className="text-lg text-foreground">Plan Route</CardTitle>
              <CardDescription className="text-muted-foreground">Get AI-powered route suggestions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader className="pb-3 text-center">
              <div className="mx-auto mb-3 p-3 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <Users className="h-6 w-6 text-primary"/>
              </div>
              <CardTitle className="text-lg text-foreground">Find Buddy</CardTitle>
              <CardDescription className="text-muted-foreground">Connect with fellow travelers</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader className="pb-3 text-center">
              <div className="mx-auto mb-3 p-3 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <Shield className="h-6 w-6 text-primary"/>
              </div>
              <CardTitle className="text-lg text-foreground">Safety Report</CardTitle>
              <CardDescription className="text-muted-foreground">Report or view safety info</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader className="pb-3 text-center">
              <div className="mx-auto mb-3 p-3 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <MessageSquare className="h-6 w-6 text-primary"/>
              </div>
              <CardTitle className="text-lg text-foreground">AI Assistant</CardTitle>
              <CardDescription className="text-muted-foreground">Chat with your transit guide</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-primary mr-2"/>
                <CardTitle className="text-foreground">Recent Routes</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">Your recent journey plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mx-auto mb-4 p-4 bg-primary/20 rounded-full w-fit">
                    <MapPin className="h-8 w-8 text-primary/60"/>
                  </div>
                  <p className="text-lg font-medium text-foreground">No routes planned yet</p>
                  <p className="text-sm">Start by planning your first route!</p>
                  <Button className="mt-4 bg-accent hover:bg-accent/80 text-accent-foreground">
                    Plan Your First Route
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2"/>
                <CardTitle className="text-foreground">Safety Updates</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">Latest safety reports in your area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-accent/20 border border-accent/30">
                  <div className="p-2 bg-accent/30 rounded-full">
                    <Shield className="h-4 w-4 text-accent"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Bloor-Yonge Station</p>
                    <p className="text-sm text-muted-foreground">Good lighting reported • 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-primary/20 border border-primary/30">
                  <div className="p-2 bg-primary/30 rounded-full">
                    <Shield className="h-4 w-4 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Spadina Station</p>
                    <p className="text-sm text-muted-foreground">Increased security presence • 5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted border border-border">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Shield className="h-4 w-4 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Union Station</p>
                    <p className="text-sm text-muted-foreground">Well-lit platform • 1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>);
}
