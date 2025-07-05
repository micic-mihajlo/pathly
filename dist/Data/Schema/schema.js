import { pgTable, text, integer, decimal, primaryKey } from 'drizzle-orm/pg-core';
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
    };
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
    };
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
    };
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
