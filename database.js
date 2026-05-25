import { createPool } from 'mysql2/promise';

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
        status
      )
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      record.userId,
      record.name,
      record.recordedAt,
      record.status
    ];

   await this.pool.execute(sql, values);
  }

  async insertMany(records) {
    for (const record of records) {
      await this.insertAttendance(record);
    }
  }
}

export default MySQLService;