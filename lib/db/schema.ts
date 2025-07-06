import { pgTable, text, serial, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  university: text('university'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').defaultNow()
});

export const safetyReports = pgTable('safety_reports', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  stopId: text('stop_id').notNull(),
  stopName: text('stop_name'),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  incidentType: text('incident_type'), // harassment, poor_lighting, etc
  lat: decimal('lat', { precision: 10, scale: 8 }),
  lng: decimal('lng', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const buddyRequests = pgTable('buddy_requests', {
  id: serial('id').primaryKey(),
  requesterId: text('requester_id').references(() => users.id),
  partnerId: text('partner_id').references(() => users.id),
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  fromLat: decimal('from_lat', { precision: 10, scale: 8 }),
  fromLng: decimal('from_lng', { precision: 11, scale: 8 }),
  toLat: decimal('to_lat', { precision: 10, scale: 8 }),
  toLng: decimal('to_lng', { precision: 11, scale: 8 }),
  travelTime: timestamp('travel_time'),
  status: text('status').default('pending'), // pending, matched, completed, cancelled
  createdAt: timestamp('created_at').defaultNow()
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  buddyRequestId: integer('buddy_request_id').references(() => buddyRequests.id),
  senderId: text('sender_id').references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SafetyReport = typeof safetyReports.$inferSelect;
export type NewSafetyReport = typeof safetyReports.$inferInsert;
export type BuddyRequest = typeof buddyRequests.$inferSelect;
export type NewBuddyRequest = typeof buddyRequests.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert; 