'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function UniversitySetup() {
    const router = useRouter();
    const [university, setUniversity] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!university.trim())
            return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/university', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ university: university.trim() }),
            });
            if (response.ok) {
                router.refresh();
            }
            else {
                console.error('Failed to update university');
            }
        }
        catch (error) {
            console.error('Error updating university:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="university">University</Label>
            <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Enter your university name" required/>
          </div>
          
          <Button type="submit" disabled={isLoading || !university.trim()} className="w-full">
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>);
}
