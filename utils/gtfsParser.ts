import { Gtfs } from 'gtfs-parser';
import * as path from 'path';

export interface GTFSAgency {
  agency_id: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang?: string;
  agency_phone?: string;
  agency_fare_url?: string;
}

export interface GTFSCalendar {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  start_date: string;
  end_date: string;
}

export interface GTFSCalendarDate {
  service_id: string;
  date: string;
  exception_type: number;
}

export interface GTFSStop {
  stop_id: string;
  stop_code?: string;
  stop_name: string;
  stop_desc?: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
  stop_url?: string;
  location_type: number;
  parent_station?: string;
  stop_timezone?: string;
  wheelchair_boarding?: number;
}

export interface GTFSShapePoint {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled?: number;
}

export interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: number;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
}

export interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: number;
  block_id?: string;
  shape_id?: string;
  wheelchair_accessible?: number;
  bikes_allowed?: number;
}

export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
  shape_dist_traveled?: number;
}

export async function parseGtfsData(gtfsPath: string) {
  const gtfs = new Gtfs(gtfsPath);
  await gtfs.init();

  const agency = await gtfs.fileParser('agency.txt');
  const calendar = await gtfs.fileParser('calendar.txt');
  const calendarDates = await gtfs.fileParser('calendar_dates.txt');
  const routes = await gtfs.fileParser('routes.txt');
  const shapes = await gtfs.fileParser('shapes.txt');
  const stops = await gtfs.fileParser('stops.txt');
  const trips = await gtfs.fileParser('trips.txt');
  const stopTimes = await gtfs.fileParser('stop_times.txt');

  return {
    agency: agency as GTFSAgency[],
    calendar: calendar as GTFSCalendar[],
    calendarDates: calendarDates as GTFSCalendarDate[],
    routes: routes as GTFSRoute[],
    shapes: shapes as GTFSShapePoint[],
    stops: stops as GTFSStop[],
    trips: trips as GTFSTrip[],
    stopTimes: stopTimes as GTFSStopTime[],
  };
}

// runParse(); 