"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var gtfsParser_1 = require("../../utils/gtfsParser");
var index_1 = require("./index");
var schema_1 = require("./schema");
var path = require("path");
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var gtfsDataPath, parsedData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    console.log("Starting GTFS data seeding...");
                    gtfsDataPath = path.join(process.cwd(), "Data", "TTC Routes and Schedules Data");
                    return [4 /*yield*/, (0, gtfsParser_1.parseGtfsData)(gtfsDataPath)];
                case 1:
                    parsedData = _a.sent();
                    console.log("Inserting Agency data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.agency).values(parsedData.agency.map(function (a) { return ({
                            agencyId: a.agency_id,
                            agencyName: a.agency_name,
                            agencyUrl: a.agency_url,
                            agencyTimezone: a.agency_timezone,
                            agencyLang: a.agency_lang,
                            agencyPhone: a.agency_phone,
                            agencyFareUrl: a.agency_fare_url,
                        }); }))];
                case 2:
                    _a.sent();
                    console.log("Inserting Calendar data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.calendar).values(parsedData.calendar.map(function (c) { return ({
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
                        }); }))];
                case 3:
                    _a.sent();
                    console.log("Inserting Calendar Dates data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.calendarDates).values(parsedData.calendarDates.map(function (cd) { return ({
                            serviceId: cd.service_id,
                            date: cd.date,
                            exceptionType: cd.exception_type,
                        }); }))];
                case 4:
                    _a.sent();
                    console.log("Inserting Routes data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.routes).values(parsedData.routes.map(function (r) { return ({
                            routeId: r.route_id,
                            agencyId: r.agency_id,
                            routeShortName: r.route_short_name,
                            routeLongName: r.route_long_name,
                            routeDesc: r.route_desc,
                            routeType: r.route_type,
                            routeUrl: r.route_url,
                            routeColor: r.route_color,
                            routeTextColor: r.route_text_color,
                        }); }))];
                case 5:
                    _a.sent();
                    console.log("Inserting Shapes data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.shapes).values(parsedData.shapes.map(function (s) { return ({
                            shapeId: s.shape_id,
                            shapePtLat: String(s.shape_pt_lat),
                            shapePtLon: String(s.shape_pt_lon),
                            shapePtSequence: s.shape_pt_sequence,
                            shapeDistTraveled: s.shape_dist_traveled
                                ? String(s.shape_dist_traveled)
                                : null,
                        }); }))];
                case 6:
                    _a.sent();
                    console.log("Inserting Stops data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.stops).values(parsedData.stops.map(function (s) { return ({
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
                        }); }))];
                case 7:
                    _a.sent();
                    console.log("Inserting Trips data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.trips).values(parsedData.trips.map(function (t) { return ({
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
                        }); }))];
                case 8:
                    _a.sent();
                    console.log("Inserting Stop Times data...");
                    return [4 /*yield*/, index_1.db.insert(schema_1.stopTimes).values(parsedData.stopTimes.map(function (st) { return ({
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
                        }); }))];
                case 9:
                    _a.sent();
                    console.log("GTFS data seeding completed successfully!");
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    console.error("Error seeding GTFS data:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
seed();
