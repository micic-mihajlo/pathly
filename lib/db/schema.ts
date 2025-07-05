import { pgTable, text, serial, integer, decimal, timestamp, primaryKey } from 'drizzle-orm/pg-core';

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

export const agency = pgTable('agency', {
  agencyId: text('agency_id').primaryKey(),
  agencyName: text('agency_name'),
  agencyUrl: text('agency_url'),
  agencyTimezone: text('agency_timezone'),
  agencyLang: text('agency_lang'),
  agencyPhone: text('agency_phone'),
  agencyFareUrl: text('agency_fare_url'),
});

export const calendar = pgTable('calendar', {
  serviceId: text('service_id').primaryKey(),
  monday: integer('monday'),
  tuesday: integer('tuesday'),
  wednesday: integer('wednesday'),
  thursday: integer('thursday'),
  friday: integer('friday'),
  saturday: integer('saturday'),
  sunday: integer('sunday'),
  startDate: text('start_date'),
  endDate: text('end_date'),
});

export const calendarDates = pgTable('calendar_dates', {
  serviceId: text('service_id').notNull(),
  date: text('date').notNull(),
  exceptionType: integer('exception_type'),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.serviceId, table.date] }),
  }
});

export const routes = pgTable('routes', {
  routeId: text('route_id').primaryKey(),
  agencyId: text('agency_id'),
  routeShortName: text('route_short_name'),
  routeLongName: text('route_long_name'),
  routeDesc: text('route_desc'),
  routeType: integer('route_type'),
  routeUrl: text('route_url'),
  routeColor: text('route_color'),
  routeTextColor: text('route_text_color'),
});

export const shapes = pgTable('shapes', {
  shapeId: text('shape_id').notNull(),
  shapePtLat: decimal('shape_pt_lat', { precision: 10, scale: 8 }),
  shapePtLon: decimal('shape_pt_lon', { precision: 11, scale: 8 }),
  shapePtSequence: integer('shape_pt_sequence').notNull(),
  shapeDistTraveled: decimal('shape_dist_traveled', { precision: 10, scale: 4 }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.shapeId, table.shapePtSequence] }),
  }
});

export const stops = pgTable('stops', {
  stopId: text('stop_id').primaryKey(),
  stopCode: text('stop_code'),
  stopName: text('stop_name'),
  stopDesc: text('stop_desc'),
  stopLat: decimal('stop_lat', { precision: 10, scale: 8 }),
  stopLon: decimal('stop_lon', { precision: 11, scale: 8 }),
  zoneId: text('zone_id'),
  stopUrl: text('stop_url'),
  locationType: integer('location_type'),
  parentStation: text('parent_station'),
  stopTimezone: text('stop_timezone'),
  wheelchairBoarding: integer('wheelchair_boarding'),
});

export const stopTimes = pgTable('stop_times', {
  tripId: text('trip_id').notNull(),
  arrivalTime: text('arrival_time'),
  departureTime: text('departure_time'),
  stopId: text('stop_id'),
  stopSequence: integer('stop_sequence').notNull(),
  stopHeadsign: text('stop_headsign'),
  pickupType: integer('pickup_type'),
  dropOffType: integer('drop_off_type'),
  shapeDistTraveled: decimal('shape_dist_traveled', { precision: 10, scale: 4 }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.tripId, table.stopSequence] }),
  }
});

export const trips = pgTable('trips', {
  routeId: text('route_id'),
  serviceId: text('service_id'),
  tripId: text('trip_id').primaryKey(),
  tripHeadsign: text('trip_headsign'),
  tripShortName: text('trip_short_name'),
  directionId: integer('direction_id'),
  blockId: text('block_id'),
  shapeId: text('shape_id'),
  wheelchairAccessible: integer('wheelchair_accessible'),
  bikesAllowed: integer('bikes_allowed'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SafetyReport = typeof safetyReports.$inferSelect;
export type NewSafetyReport = typeof safetyReports.$inferInsert;
export type BuddyRequest = typeof buddyRequests.$inferSelect;
export type NewBuddyRequest = typeof buddyRequests.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert; 
export type Agency = typeof agency.$inferSelect;
export type NewAgency = typeof agency.$inferInsert;
export type Calendar = typeof calendar.$inferSelect;
export type NewCalendar = typeof calendar.$inferInsert;
export type CalendarDate = typeof calendarDates.$inferSelect;
export type NewCalendarDate = typeof calendarDates.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type Shape = typeof shapes.$inferSelect;
export type NewShape = typeof shapes.$inferInsert;
export type Stop = typeof stops.$inferSelect;
export type NewStop = typeof stops.$inferInsert;
export type StopTime = typeof stopTimes.$inferSelect;
export type NewStopTime = typeof stopTimes.$inferInsert;
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert; 