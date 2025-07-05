"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trips = exports.stopTimes = exports.stops = exports.shapes = exports.routes = exports.calendarDates = exports.calendar = exports.agency = exports.messages = exports.buddyRequests = exports.safetyReports = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    university: (0, pg_core_1.text)('university'),
    firstName: (0, pg_core_1.text)('first_name'),
    lastName: (0, pg_core_1.text)('last_name'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
exports.safetyReports = (0, pg_core_1.pgTable)('safety_reports', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').references(() => exports.users.id),
    stopId: (0, pg_core_1.text)('stop_id').notNull(),
    stopName: (0, pg_core_1.text)('stop_name'),
    rating: (0, pg_core_1.integer)('rating').notNull(), // 1-5
    comment: (0, pg_core_1.text)('comment'),
    incidentType: (0, pg_core_1.text)('incident_type'), // harassment, poor_lighting, etc
    lat: (0, pg_core_1.decimal)('lat', { precision: 10, scale: 8 }),
    lng: (0, pg_core_1.decimal)('lng', { precision: 11, scale: 8 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
exports.buddyRequests = (0, pg_core_1.pgTable)('buddy_requests', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    requesterId: (0, pg_core_1.text)('requester_id').references(() => exports.users.id),
    partnerId: (0, pg_core_1.text)('partner_id').references(() => exports.users.id),
    fromAddress: (0, pg_core_1.text)('from_address'),
    toAddress: (0, pg_core_1.text)('to_address'),
    fromLat: (0, pg_core_1.decimal)('from_lat', { precision: 10, scale: 8 }),
    fromLng: (0, pg_core_1.decimal)('from_lng', { precision: 11, scale: 8 }),
    toLat: (0, pg_core_1.decimal)('to_lat', { precision: 10, scale: 8 }),
    toLng: (0, pg_core_1.decimal)('to_lng', { precision: 11, scale: 8 }),
    travelTime: (0, pg_core_1.timestamp)('travel_time'),
    status: (0, pg_core_1.text)('status').default('pending'), // pending, matched, completed, cancelled
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    buddyRequestId: (0, pg_core_1.integer)('buddy_request_id').references(() => exports.buddyRequests.id),
    senderId: (0, pg_core_1.text)('sender_id').references(() => exports.users.id),
    content: (0, pg_core_1.text)('content').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
exports.agency = (0, pg_core_1.pgTable)('agency', {
    agencyId: (0, pg_core_1.text)('agency_id').primaryKey(),
    agencyName: (0, pg_core_1.text)('agency_name'),
    agencyUrl: (0, pg_core_1.text)('agency_url'),
    agencyTimezone: (0, pg_core_1.text)('agency_timezone'),
    agencyLang: (0, pg_core_1.text)('agency_lang'),
    agencyPhone: (0, pg_core_1.text)('agency_phone'),
    agencyFareUrl: (0, pg_core_1.text)('agency_fare_url'),
});
exports.calendar = (0, pg_core_1.pgTable)('calendar', {
    serviceId: (0, pg_core_1.text)('service_id').primaryKey(),
    monday: (0, pg_core_1.integer)('monday'),
    tuesday: (0, pg_core_1.integer)('tuesday'),
    wednesday: (0, pg_core_1.integer)('wednesday'),
    thursday: (0, pg_core_1.integer)('thursday'),
    friday: (0, pg_core_1.integer)('friday'),
    saturday: (0, pg_core_1.integer)('saturday'),
    sunday: (0, pg_core_1.integer)('sunday'),
    startDate: (0, pg_core_1.text)('start_date'),
    endDate: (0, pg_core_1.text)('end_date'),
});
exports.calendarDates = (0, pg_core_1.pgTable)('calendar_dates', {
    serviceId: (0, pg_core_1.text)('service_id').notNull(),
    date: (0, pg_core_1.text)('date').notNull(),
    exceptionType: (0, pg_core_1.integer)('exception_type'),
}, (table) => {
    return {
        pk: (0, pg_core_1.primaryKey)({ columns: [table.serviceId, table.date] }),
    };
});
exports.routes = (0, pg_core_1.pgTable)('routes', {
    routeId: (0, pg_core_1.text)('route_id').primaryKey(),
    agencyId: (0, pg_core_1.text)('agency_id'),
    routeShortName: (0, pg_core_1.text)('route_short_name'),
    routeLongName: (0, pg_core_1.text)('route_long_name'),
    routeDesc: (0, pg_core_1.text)('route_desc'),
    routeType: (0, pg_core_1.integer)('route_type'),
    routeUrl: (0, pg_core_1.text)('route_url'),
    routeColor: (0, pg_core_1.text)('route_color'),
    routeTextColor: (0, pg_core_1.text)('route_text_color'),
});
exports.shapes = (0, pg_core_1.pgTable)('shapes', {
    shapeId: (0, pg_core_1.text)('shape_id').notNull(),
    shapePtLat: (0, pg_core_1.decimal)('shape_pt_lat', { precision: 10, scale: 8 }),
    shapePtLon: (0, pg_core_1.decimal)('shape_pt_lon', { precision: 11, scale: 8 }),
    shapePtSequence: (0, pg_core_1.integer)('shape_pt_sequence').notNull(),
    shapeDistTraveled: (0, pg_core_1.decimal)('shape_dist_traveled', { precision: 10, scale: 4 }),
}, (table) => {
    return {
        pk: (0, pg_core_1.primaryKey)({ columns: [table.shapeId, table.shapePtSequence] }),
    };
});
exports.stops = (0, pg_core_1.pgTable)('stops', {
    stopId: (0, pg_core_1.text)('stop_id').primaryKey(),
    stopCode: (0, pg_core_1.text)('stop_code'),
    stopName: (0, pg_core_1.text)('stop_name'),
    stopDesc: (0, pg_core_1.text)('stop_desc'),
    stopLat: (0, pg_core_1.decimal)('stop_lat', { precision: 10, scale: 8 }),
    stopLon: (0, pg_core_1.decimal)('stop_lon', { precision: 11, scale: 8 }),
    zoneId: (0, pg_core_1.text)('zone_id'),
    stopUrl: (0, pg_core_1.text)('stop_url'),
    locationType: (0, pg_core_1.integer)('location_type'),
    parentStation: (0, pg_core_1.text)('parent_station'),
    stopTimezone: (0, pg_core_1.text)('stop_timezone'),
    wheelchairBoarding: (0, pg_core_1.integer)('wheelchair_boarding'),
});
exports.stopTimes = (0, pg_core_1.pgTable)('stop_times', {
    tripId: (0, pg_core_1.text)('trip_id').notNull(),
    arrivalTime: (0, pg_core_1.text)('arrival_time'),
    departureTime: (0, pg_core_1.text)('departure_time'),
    stopId: (0, pg_core_1.text)('stop_id'),
    stopSequence: (0, pg_core_1.integer)('stop_sequence').notNull(),
    stopHeadsign: (0, pg_core_1.text)('stop_headsign'),
    pickupType: (0, pg_core_1.integer)('pickup_type'),
    dropOffType: (0, pg_core_1.integer)('drop_off_type'),
    shapeDistTraveled: (0, pg_core_1.decimal)('shape_dist_traveled', { precision: 10, scale: 4 }),
}, (table) => {
    return {
        pk: (0, pg_core_1.primaryKey)({ columns: [table.tripId, table.stopSequence] }),
    };
});
exports.trips = (0, pg_core_1.pgTable)('trips', {
    routeId: (0, pg_core_1.text)('route_id'),
    serviceId: (0, pg_core_1.text)('service_id'),
    tripId: (0, pg_core_1.text)('trip_id').primaryKey(),
    tripHeadsign: (0, pg_core_1.text)('trip_headsign'),
    tripShortName: (0, pg_core_1.text)('trip_short_name'),
    directionId: (0, pg_core_1.integer)('direction_id'),
    blockId: (0, pg_core_1.text)('block_id'),
    shapeId: (0, pg_core_1.text)('shape_id'),
    wheelchairAccessible: (0, pg_core_1.integer)('wheelchair_accessible'),
    bikesAllowed: (0, pg_core_1.integer)('bikes_allowed'),
});
