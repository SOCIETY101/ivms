import { createPool } from "mysql2/promise";
import moment from "moment";
class MySQLService {
  constructor() {
    this.maxSize = 1000;
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

  async insertRecords(records) {
      const sql = `
        INSERT INTO ${process.env.DATABASE_TABLE} (
          userId,
          name,
          recorded_at,
          status,
          room
        )
        VALUES ?
      `;
    for (let i = 0; i < records.length; i += this.maxSize) {
      const chunk = records.slice(i, i + this.maxSize);
      const values = chunk.map((record) => [
        record.userId,
        record.name,
        moment(record.recordedAt.replace(/([+-]\d{2}:\d{2}|Z)$/, "")).format(
          "YYYY-MM-DD HH:mm:ss",
        ),
        record.status,
        record.device,
      ]);
      await this.pool.query(sql, [values]);
    }
  }

  async deleteRecords() {
     const sql = ` DELETE FROM ${process.env.DATABASE_TABLE} WHERE DATE(recorded_at) = DATE(?)`;
     const previousDay = moment().utc(true).subtract(1, "days").startOf("days").format("YYYY-MM-DD");
    await this.pool.query(sql, [previousDay]);
  };

  async insertMany(records, isDailyTask = false) {
    try {
      if (isDailyTask) {
        await this.deleteRecords();
      };
      await this.insertRecords(records);
    } catch (e) {
      throw new Error(e?.message || "Failed Insert/Delete Database");
    } finally {
      await this.pool.end();
    }
  }
}

export default MySQLService;