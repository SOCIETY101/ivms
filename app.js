import { schedule } from "node-cron";
import Notification from "./notification.js";
import persistRecords from "./helper.js";
import dotenv from "dotenv";
import moment from "moment";

dotenv.config();

// Initialize notification service
const notification = new Notification({
    email: process.env.EMAIL,
    password: process.env.EMAIL_PASSWORD,
    service: process.env.EMAIL_SERVICE
});

const devices = [
  {
    name: "watch_device_1",
    host: process.env.HOST_1,
    username: process.env.USERNAME,
    password: process.env.PASSWORD_DEVICE_1,
    room: "room 3"
  },
  {
    name: "watch_device_2",
    host: process.env.HOST_2,
    username: process.env.USERNAME,
    password: process.env.PASSWORD_DEVICE_2,
    room: "room 5"
  },
];

// Schedule the task to run every 15 seconds

try {
  const watchAllDevices = schedule(
    "*/15 * * * * 1-6",
    async () => {
      await Promise.all(devices.map((device) => persistRecords({...device, notification})));
    },
    {
      scheduled: true,
      recoverMissedExecutions: false,
      name: "watchAllDevices",
      timezone: "Africa/Casablanca",
      runOnInit: false,
    },
  );
} catch (e) {
  // Log the error for debugging purposes
  console.log(`unable to execute Attendance records task at ${moment().format("YYYY-MM-DD HH:mm:ss")}\n`, e?.message);
}

// Schedule a Daily task at 3:00 AM every day
try {
  const dailyTask = schedule(
    "0 3 * * *",
    async () => {
       await Promise.all(devices.map((device) => persistRecords({...device, notification, isDailyTask: true})));
    },
    {
      scheduled: true,
      recoverMissedExecutions: false,
      name: "dailyTask",
      timezone: "Africa/Casablanca",
      runOnInit: false,
    },
  );
} catch (e) {
  console.log(`Unable to execute Daily task at ${moment().format("YYYY-MM-DD HH:mm:ss")}\n`, e?.message);
}