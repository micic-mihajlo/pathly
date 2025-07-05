"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGtfsData = parseGtfsData;
const gtfs_parser_1 = require("gtfs-parser");
async function parseGtfsData(gtfsPath) {
    const gtfs = new gtfs_parser_1.Gtfs(gtfsPath);
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
        agency: agency,
        calendar: calendar,
        calendarDates: calendarDates,
        routes: routes,
        shapes: shapes,
        stops: stops,
        trips: trips,
        stopTimes: stopTimes,
    };
}
// runParse(); 
