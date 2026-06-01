import { schedule } from "node-cron";
import HikvisionAPI from "./Hikvision.js";
import MySQLService from "./database.js";
import dotenv from "dotenv";
dotenv.config();
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
        });
        const attendance = await hikvisionAPI.getAttendance();
        if (attendance?.numOfMatches > 0) {
          const mySQLService = new MySQLService();
          const users = await hikvisionAPI.getUserInfo({
            userIds: attendance.records.map((record) => record.userId),
          });
          await mySQLService.insertMany(
            attendance.records.map((record) => ({
              userId: record.userId,
              name:
                users.find((user) => user.userId === record.userId)?.name ||
                null,
              status: record.status,
              recordedAt: record.recordedAt,
              device:"room 3"
            })),
          );
        }
      } catch (_) {
        console.log("Error fetching attendance data for device 1");
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
        });
        const attendance = await hikvisionAPI.getAttendance();
        if (attendance?.numOfMatches > 0) {
          const mySQLService = new MySQLService();
          const users = await hikvisionAPI.getUserInfo({
            userIds: attendance.records.map((record) => record.userId),
          });
          await mySQLService.insertMany(
            attendance.records.map((record) => ({
              userId: record.userId,
              name:  users.find((user) => user.userId === record.userId)?.name || 'Unknown',
              status: record.status,
              recordedAt: record.recordedAt,
              device:"room 5"
            })),
          );
        }
      } catch (_) {
        console.log("Error fetching attendance data for device 2",_);
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
