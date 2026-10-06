import { createPool } from "mysql2/promise";
import moment from "moment";
import _ from "lodash";

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

  async deleteRecords(room) {
    const sql = `DELETE FROM ${process.env.DATABASE_TABLE} WHERE room = ? and recorded_at between ? and ?`;
    const previousDay = moment().subtract(1, "day").startOf("day").format("YYYY-MM-DD HH:mm");
    const nextDay = moment().format("YYYY-MM-DD HH:mm");
    await this.pool.query(sql, [room,previousDay,nextDay]);
  };

  async insertMany(records) {
    try {
      await this.insertRecords(records);
    } catch (e) {
      throw new Error(e?.message || "Failed Insert/Delete Database");
    } finally {
      await this.pool.end();
    }
  }

  async insertManyRefresh(records,room) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      if(_.size(records)) await this.deleteRecords(room);
      await this.insertRecords(records);
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw new Error(e?.message || "Failed Insert/Delete Database");
    } finally {
      await this.pool.end();
    }
  }
}

export default MySQLService;