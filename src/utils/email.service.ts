import * as nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";

export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  templateData: Record<string, string>
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const templatePath = path.resolve(
      process.cwd(),
      "src",
      "utils",
      "templates",
      "set-password.html"
    );

    let htmlContent = fs.readFileSync(templatePath, "utf-8");

    for (const [key, value] of Object.entries(templateData)) {
      htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    const mailOptions = {
      from: `"Cinema Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    throw new Error("Email sending failed");
  }
};
