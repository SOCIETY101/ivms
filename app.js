import { schedule } from "node-cron";
import HikvisionAPI from "./Hikvision.js";
import MySQLService from "./database.js";
import Notification from "./notification.js";
import dotenv from "dotenv";
dotenv.config();

// Initialize notification service
const notification = new Notification({
    email: process.env.EMAIL,
    password: process.env.EMAIL_PASSWORD,
    service: process.env.EMAIL_SERVICE
});

try {
  // Watch device 1 every 15 seconds
  const watchDevice_1 = schedule(
    "*/15 * * * * *",
    async () => {
      try {
        const hikvisionAPI = new HikvisionAPI({
          host: process.env.HOST_1,
          username: process.env.USERNAME,
          password: process.env.PASSWORD_DEVICE_1,
          device:'room 3'
        });
        const attendance = await hikvisionAPI.getAttendance({position: 0});
        if (attendance?.numOfMatches > 0) {
          const mySQLService = new MySQLService();
          const users = await hikvisionAPI.getUserInfo({
            userIds:[...new Set(attendance.records.map(record => record.userId))],
            position:0
          });
          await mySQLService.insertMany(
            attendance.records.map((record) => ({
              userId: record.userId,
              name:users.find((user) => user.userId === record.userId)?.name || 'Unknown',
              status: record.status,
              recordedAt: record.recordedAt,
              device:attendance.device
            })),
          );
        }
      } catch (_) {
        notification.sendEmail({body: `Failed to fetch attendance data for room 3\n. ${_.message}`, room: 'room 3'});
        console.log("Fetching attendance data for device 1");
      }
    },
    {
      scheduled: true,
      recoverMissedExecutions: false,
      name: "watchDevice_1",
      timezone: "Africa/Casablanca",
      runOnInit: false,
    },
  );
} catch (e) {
  console.error("Error during task <watchDevice_1> execution:", e?.message);
}

try {
  // Watch device 2 every 15 seconds
  const watchDevice_2 = schedule(
    "*/15 * * * * *",
    async () => {
      try {
        const hikvisionAPI = new HikvisionAPI({
          host: process.env.HOST_2,
          username: process.env.USERNAME,
          password: process.env.PASSWORD_DEVICE_2,
          device:'room 5'
        });
        const attendance = await hikvisionAPI.getAttendance({position:0});
        if (attendance?.numOfMatches > 0) {
          const mySQLService = new MySQLService();
          const users = await hikvisionAPI.getUserInfo({
            userIds:[...new Set(attendance.records.map(record => record.userId))],
            position:0
          });
          await mySQLService.insertMany(
            attendance.records.map((record) => ({
              userId: record.userId,
              name:  users.find((user) => user.userId === record.userId)?.name || 'Unknown',
              status: record.status,
              recordedAt: record.recordedAt,
              device:attendance.device
            })),
          );
        }
      } catch (_) {
        notification.sendEmail({body: `Failed to fetch attendance data for room 5\n. ${_.message}`, room: 'room 5'});
        console.log("Fetching attendance data for device 2");
      }
    },
    {
      scheduled: true,
      recoverMissedExecutions: false,
      name: "watchDevice_2",
      timezone: "Africa/Casablanca",
      runOnInit: false,
    },
  );
} catch (e) {
  console.error("Error during task <watchDevice_2> execution:", e?.message);
}
