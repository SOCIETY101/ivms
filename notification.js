import { createTransport } from 'nodemailer';

class Notification {
    constructor({ email, password,service }) {
        this.email = email;
        this.transporter = createTransport({
            service: service,
            auth: {
                user: this.email,
                pass: password,
            },
        });
    }

    async sendEmail({subject=null, body}) {
        try {
            const info = await this.transporter.sendMail({
                from: this.email,
                to:this.email,
                subject :'Attendance Report',
                text:body,
            });
        } catch (error) {
            console.log('Failed to send email', error?.message);
        }
    }
}

export default Notification;