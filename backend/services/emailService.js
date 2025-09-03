const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@persiraja.com',
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, name) {
    const subject = 'Selamat Datang di Persiraja!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a;">Selamat Datang, ${name}!</h1>
        <p>Terima kasih telah bergabung dengan komunitas Persiraja. Sekarang Anda dapat:</p>
        <ul>
          <li>Membeli tiket pertandingan</li>
          <li>Berbelanja merchandise resmi</li>
          <li>Mendapatkan berita terbaru</li>
          <li>Mengikuti perkembangan tim</li>
        </ul>
        <p>Mari bersama-sama dukung Laskar Rencong!</p>
        <p style="color: #666;">Salam,<br>Tim Persiraja</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Reset Password - Persiraja';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a;">Reset Password</h1>
        <p>Anda telah meminta untuk mereset password. Klik link di bawah ini:</p>
        <a href="${resetUrl}" style="background: #1a472a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        <p style="margin-top: 20px; color: #666;">Link ini akan expired dalam 1 jam.</p>
        <p style="color: #666;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendOrderConfirmation(email, orderData) {
    const subject = `Konfirmasi Pesanan #${orderData.order_id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a;">Konfirmasi Pesanan</h1>
        <p>Terima kasih atas pesanan Anda!</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h3>Detail Pesanan #${orderData.order_id}</h3>
          <p><strong>Total:</strong> Rp ${orderData.total?.toLocaleString('id-ID')}</p>
          <p><strong>Status:</strong> ${orderData.status}</p>
          <p><strong>Tanggal:</strong> ${new Date(orderData.created_at).toLocaleDateString('id-ID')}</p>
        </div>
        <p>Kami akan menghubungi Anda jika ada update terkait pesanan.</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendTicketConfirmation(email, ticketData) {
    const subject = `Tiket Pertandingan - ${ticketData.match_title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a;">Tiket Anda Sudah Siap!</h1>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h3>${ticketData.match_title}</h3>
          <p><strong>Tanggal:</strong> ${new Date(ticketData.match_date).toLocaleDateString('id-ID')}</p>
          <p><strong>Venue:</strong> ${ticketData.venue}</p>
          <p><strong>Jumlah Tiket:</strong> ${ticketData.quantity}</p>
          <p><strong>Tipe Seat:</strong> ${ticketData.seat_type}</p>
        </div>
        <p>Simpan email ini sebagai bukti pembelian tiket. Tunjukkan QR code saat masuk stadion.</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();