import { createTransport } from "nodemailer";
import moment from "moment";
class Notification {
  constructor({ email, password, service }) {
    this.retry = [
      { device: "room 3",lastAttempt: null },
      { device: "room 5",lastAttempt: null },
    ];
    this.email = email;
    this.transporter = createTransport({
      service: service,
      auth: {
        user: this.email,
        pass: password,
      },
    });
  }

  async sendEmail({ subject = null, body,room = null }) {
    try {
      const deviceIndex = this.retry.findIndex((item) => item.device === room);
      const device = this.retry[deviceIndex];
      if(device && device.lastAttempt && (moment().utc(true).diff(moment(device.lastAttempt).utc(true), 'hours') < 1)){  
        return;
      }
       await this.transporter.sendMail({
        from: this.email,
        to: this.email,
        subject: `Attendance Report - ${moment().format("YYYY-MM-DD HH:mm:ss")}`,
        text: body,
      });
      this.retry[deviceIndex].lastAttempt = moment().utc(true);
    } catch (error) {
      console.log("Failed to send email", error?.message);
    }
  }
}

export default Notification;