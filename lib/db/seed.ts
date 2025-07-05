import { parseGtfsData, GTFSAgency, GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSShapePoint, GTFSStop, GTFSTrip, GTFSStopTime } from "../../utils/gtfsParser";
import { db } from "./index";
import {
  agency,
  calendar,
  calendarDates,
  routes,
  shapes,
  stops,
  trips,
  stopTimes,
} from "./schema";
import * as path from "path";
import * as http from "http";
import * as fs from "fs";

const PORT = 3001;

async function seed() {
  let server: http.Server | undefined;
  try {
    console.log("Starting GTFS data seeding...");

    const gtfsZipFilePath = path.join(
      process.cwd(),
      "Data",
      "TTC Routes and Schedules Data.zip"
    );

    // Start a temporary HTTP server to serve the GTFS zip file
    server = http.createServer((req, res) => {
      if (req.url === "/TTC%20Routes%20and%20Schedules%20Data.zip") {
        fs.readFile(gtfsZipFilePath, (err, data) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error loading GTFS zip file");
            return;
          }
          res.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Length": data.length,
          });
          res.end(data);
        });
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    await new Promise<void>((resolve, reject) => {
      server!.listen(PORT, "localhost", () => {
        console.log(`Temporary HTTP server listening on http://localhost:${PORT}`);
        resolve();
      });
      server!.on("error", (err) => {
        reject(err);
      });
    });

    const gtfsDataUrl = `http://localhost:${PORT}/TTC%20Routes%20and%20Schedules%20Data.zip`;
    const parsedData: {
      agency: GTFSAgency[];
      calendar: GTFSCalendar[];
      calendarDates: GTFSCalendarDate[];
      routes: GTFSRoute[];
      shapes: GTFSShapePoint[];
      stops: GTFSStop[];
      trips: GTFSTrip[];
      stopTimes: GTFSStopTime[];
    } = await parseGtfsData(gtfsDataUrl);

    console.log("Inserting Agency data...");
    await db.insert(agency).values(
      parsedData.agency.map((a: GTFSAgency) => ({
        agencyId: a.agency_id,
        agencyName: a.agency_name,
        agencyUrl: a.agency_url,
        agencyTimezone: a.agency_timezone,
        agencyLang: a.agency_lang,
        agencyPhone: a.agency_phone,
        agencyFareUrl: a.agency_fare_url,
      }))
    );

    console.log("Inserting Calendar data...");
    await db.insert(calendar).values(
      parsedData.calendar.map((c: GTFSCalendar) => ({
        serviceId: c.service_id,
        monday: c.monday,
        tuesday: c.tuesday,
        wednesday: c.wednesday,
        thursday: c.thursday,
        friday: c.friday,
        saturday: c.saturday,
        sunday: c.sunday,
        startDate: c.start_date,
        endDate: c.end_date,
      }))
    );

    console.log("Inserting Calendar Dates data...");
    await db.insert(calendarDates).values(
      parsedData.calendarDates.map((cd: GTFSCalendarDate) => ({
        serviceId: cd.service_id,
        date: cd.date,
        exceptionType: cd.exception_type,
      }))
    );

    console.log("Inserting Routes data...");
    await db.insert(routes).values(
      parsedData.routes.map((r: GTFSRoute) => ({
        routeId: r.route_id,
        agencyId: r.agency_id,
        routeShortName: r.route_short_name,
        routeLongName: r.route_long_name,
        routeDesc: r.route_desc,
        routeType: r.route_type,
        routeUrl: r.route_url,
        routeColor: r.route_color,
        routeTextColor: r.route_text_color,
      }))
    );

    console.log("Inserting Shapes data...");
    await db.insert(shapes).values(
      parsedData.shapes.map((s: GTFSShapePoint) => ({
        shapeId: s.shape_id,
        shapePtLat: String(s.shape_pt_lat),
        shapePtLon: String(s.shape_pt_lon),
        shapePtSequence: s.shape_pt_sequence,
        shapeDistTraveled: s.shape_dist_traveled
          ? String(s.shape_dist_traveled)
          : null,
      }))
    );

    console.log("Inserting Stops data...");
    await db.insert(stops).values(
      parsedData.stops.map((s: GTFSStop) => ({
        stopId: s.stop_id,
        stopCode: s.stop_code,
        stopName: s.stop_name,
        stopDesc: s.stop_desc,
        stopLat: String(s.stop_lat),
        stopLon: String(s.stop_lon),
        zoneId: s.zone_id,
        stopUrl: s.stop_url,
        locationType: s.location_type,
        parentStation: s.parent_station,
        stopTimezone: s.stop_timezone,
        wheelchairBoarding: s.wheelchair_boarding,
      }))
    );

    console.log("Inserting Trips data...");
    await db.insert(trips).values(
      parsedData.trips.map((t: GTFSTrip) => ({
        routeId: t.route_id,
        serviceId: t.service_id,
        tripId: t.trip_id,
        tripHeadsign: t.trip_headsign,
        tripShortName: t.trip_short_name,
        directionId: t.direction_id,
        blockId: t.block_id,
        shapeId: t.shape_id,
        wheelchairAccessible: t.wheelchair_accessible,
        bikesAllowed: t.bikes_allowed,
      }))
    );

    console.log("Inserting Stop Times data...");
    await db.insert(stopTimes).values(
      parsedData.stopTimes.map((st: GTFSStopTime) => ({
        tripId: st.trip_id,
        arrivalTime: st.arrival_time,
        departureTime: st.departure_time,
        stopId: st.stop_id,
        stopSequence: st.stop_sequence,
        stopHeadsign: st.stop_headsign,
        pickupType: st.pickup_type,
        dropOffType: st.drop_off_type,
        shapeDistTraveled: st.shape_dist_traveled
          ? String(st.shape_dist_traveled)
          : null,
      }))
    );

    console.log("GTFS data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding GTFS data:", error);
    process.exit(1);
  } finally {
    // Close the temporary HTTP server
    server?.close();
  }
}

seed(); 