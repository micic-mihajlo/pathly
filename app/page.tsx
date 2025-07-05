import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Shield, Users, Zap, Navigation } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Pathly
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" className="hover:bg-primary/10">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-accent hover:bg-accent/80 text-accent-foreground">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-card">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Navigation className="h-8 w-8 text-primary mr-2" />
              <span className="text-sm font-medium text-gray-700 bg-primary/10 px-3 py-1 rounded-full">
                AI-Powered Transit
              </span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-gray-800">
              Your Smart
              <span className="block text-gray-800">
                Transit Companion
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Safe, weather-aware routes and travel buddies for international students in Ontario. 
              <span className="text-gray-700 font-medium"> Never travel alone in the dark again.</span>
            </p>
            
            <SignedOut>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <SignUpButton mode="modal">
                  <Button size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all">
                    <Navigation className="mr-2 h-5 w-5" />
                    Start Your Journey
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-muted">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </SignedOut>
            
            <SignedIn>
              <Button size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all" asChild>
                <a href="/dashboard">
                  <MapPin className="mr-2 h-5 w-5" />
                  Open Dashboard
                </a>
              </Button>
            </SignedIn>

            <div className="mt-12 text-sm text-muted-foreground">
              <p>Trusted by students across Ontario • Free to use • Community-driven</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-b from-card to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 text-foreground">Why Students Choose Pathly</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built by students, for students. Experience the future of safe transit navigation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-border hover:border-primary/40 hover:shadow-lg transition-all">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/20 rounded-full w-fit">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl text-foreground">Safety First</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Real-time safety ratings from the student community. Avoid poorly lit areas and high-risk zones with confidence.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-border hover:border-primary/40 hover:shadow-lg transition-all">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/20 rounded-full w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl text-foreground">Travel Buddies</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Find fellow students heading your way. Travel together for safety, companionship, and shared experiences.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-border hover:border-primary/40 hover:shadow-lg transition-all">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/20 rounded-full w-fit">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl text-foreground">AI-Powered</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Smart route planning that considers weather, time of day, and your personal safety preferences.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 bg-primary/20 rounded-lg mr-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Pathly
            </span>
          </div>
          <p className="text-muted-foreground">
            &copy; 2024 Pathly. Made for students, by students. 🎓
          </p>
        </div>
      </footer>
    </div>
  );
}
