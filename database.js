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

  async insertRecords(records, sql) {
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

  async insertMany(records) {
    try {
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
      await this.insertRecords(records, sql);
    } catch (e) {
      throw new Error(e?.message || "Failed Insert Into Database");
    } finally {
      await this.pool.end();
    }
  }
}

export default MySQLService;