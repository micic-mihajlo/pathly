import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';
export async function syncUserFromClerk() {
    var _a, _b;
    const clerkUser = await currentUser();
    if (!clerkUser)
        return null;
    try {
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.id, clerkUser.id)).limit(1);
        if (existingUser.length > 0) {
            return existingUser[0];
        }
        // Create new user
        const newUser = await db.insert(users).values({
            id: clerkUser.id,
            email: ((_a = clerkUser.emailAddresses[0]) === null || _a === void 0 ? void 0 : _a.emailAddress) || '',
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            university: ((_b = clerkUser.publicMetadata) === null || _b === void 0 ? void 0 : _b.university) || null,
        }).returning();
        return newUser[0];
    }
    catch (error) {
        console.error('Error syncing user:', error);
        throw error;
    }
}
export async function updateUserUniversity(userId, university) {
    try {
        await db.update(users)
            .set({ university })
            .where(eq(users.id, userId));
    }
    catch (error) {
        console.error('Error updating university:', error);
        throw error;
    }
}
