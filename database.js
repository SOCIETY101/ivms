import { createPool } from 'mysql2/promise';
import moment from "moment";
class MySQLService {
  constructor() {
    this.pool = createPool({
      host: process.env.DATABASE_URL,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      port: process.env.DATABASE_PORT,
      waitForConnections: true,
      connectionLimit: 10
    });
  }

  async insertAttendance(record) {
    const sql = `
      INSERT INTO ${process.env.DATABASE_TABLE} (
        userId,
        name,
        recorded_at,
        status,
        room
      )
      VALUES (?, ?, ?, ?,?)
    `
    const values = [
      record.userId,
      record.name,
      moment(record.recordedAt.replace(/([+-]\d{2}:\d{2}|Z)$/, "")).format("YYYY-MM-DD HH:mm:ss"),
      record.status,
      record.device
    ];

   await this.pool.execute(sql, values);
  }

  async insertMany(records) {
    for (const record of records) {
      await this.insertAttendance(record);
    }
  }

  async close(){
    await this.pool.end();
  }
  
}

export default MySQLService;