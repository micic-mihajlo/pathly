"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const gtfsParser_1 = require("../../utils/gtfsParser");
const index_1 = require("./index");
const schema_1 = require("./schema");
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const PORT = 3001;
async function seed() {
    let server;
    try {
        console.log("Starting GTFS data seeding...");
        const gtfsZipFilePath = path.join(process.cwd(), "Data", "TTC Routes and Schedules Data.zip");
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
            }
            else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found");
            }
        });
        await new Promise((resolve, reject) => {
            server.listen(PORT, "localhost", () => {
                console.log(`Temporary HTTP server listening on http://localhost:${PORT}`);
                resolve();
            });
            server.on("error", (err) => {
                reject(err);
            });
        });
        const gtfsDataUrl = `http://localhost:${PORT}/TTC%20Routes%20and%20Schedules%20Data.zip`;
        const parsedData = await (0, gtfsParser_1.parseGtfsData)(gtfsDataUrl);
        console.log("Inserting Agency data...");
        await index_1.db.insert(schema_1.agency).values(parsedData.agency.map((a) => ({
            agencyId: a.agency_id,
            agencyName: a.agency_name,
            agencyUrl: a.agency_url,
            agencyTimezone: a.agency_timezone,
            agencyLang: a.agency_lang,
            agencyPhone: a.agency_phone,
            agencyFareUrl: a.agency_fare_url,
        })));
        console.log("Inserting Calendar data...");
        await index_1.db.insert(schema_1.calendar).values(parsedData.calendar.map((c) => ({
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
        })));
        console.log("Inserting Calendar Dates data...");
        await index_1.db.insert(schema_1.calendarDates).values(parsedData.calendarDates.map((cd) => ({
            serviceId: cd.service_id,
            date: cd.date,
            exceptionType: cd.exception_type,
        })));
        console.log("Inserting Routes data...");
        await index_1.db.insert(schema_1.routes).values(parsedData.routes.map((r) => ({
            routeId: r.route_id,
            agencyId: r.agency_id,
            routeShortName: r.route_short_name,
            routeLongName: r.route_long_name,
            routeDesc: r.route_desc,
            routeType: r.route_type,
            routeUrl: r.route_url,
            routeColor: r.route_color,
            routeTextColor: r.route_text_color,
        })));
        console.log("Inserting Shapes data...");
        await index_1.db.insert(schema_1.shapes).values(parsedData.shapes.map((s) => ({
            shapeId: s.shape_id,
            shapePtLat: String(s.shape_pt_lat),
            shapePtLon: String(s.shape_pt_lon),
            shapePtSequence: s.shape_pt_sequence,
            shapeDistTraveled: s.shape_dist_traveled
                ? String(s.shape_dist_traveled)
                : null,
        })));
        console.log("Inserting Stops data...");
        await index_1.db.insert(schema_1.stops).values(parsedData.stops.map((s) => ({
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
        })));
        console.log("Inserting Trips data...");
        await index_1.db.insert(schema_1.trips).values(parsedData.trips.map((t) => ({
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
        })));
        console.log("Inserting Stop Times data...");
        await index_1.db.insert(schema_1.stopTimes).values(parsedData.stopTimes.map((st) => ({
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
        })));
        console.log("GTFS data seeding completed successfully!");
    }
    catch (error) {
        console.error("Error seeding GTFS data:", error);
        process.exit(1);
    }
    finally {
        // Close the temporary HTTP server
        server === null || server === void 0 ? void 0 : server.close();
    }
}
seed();
