
import HikvisionAPI from "./hikvision.js";
import MySQLService from "./database.js";
import moment from "moment";


async function persistRecords({ name, host, username, password,room, notification,isDailyTask = false }) {
  try {
    const hikvisionAPI = new HikvisionAPI({
      host,
      username,
      password,
      device: room,
      s: isDailyTask ? moment().utc(true).subtract(1, "days").startOf("days").format("YYYY-MM-DDTHH:mm:ssZ") : undefined,
      e: isDailyTask ? moment().utc(true).subtract(1, "days").endOf("days").format("YYYY-MM-DDTHH:mm:ssZ") : undefined
    });

    const attendance = await hikvisionAPI.getAttendance({ position: 0 });

    if (attendance?.numOfMatches > 0) {
      const mySQLService = new MySQLService();
      const users = await hikvisionAPI.getUserInfo({
        userIds: [...new Set(attendance.records.map((record) => record.userId))],
        position: 0,
      });

      await mySQLService.insertMany(attendance.recordsByUserId(room, users),isDailyTask);
    }
  } catch (_) {
    // Send notification email on failure
    notification.sendEmail({body: `${name} unable to fetch attendance records for ${room}\n. ${_.message}`, room });
    // Log the error for debugging purposes
    console.log(`${name} unable to fetch attendance records for ${room} at ${moment().format("YYYY-MM-DD HH:mm:ss")}\n`, _.message);
  }
}

export default persistRecords;