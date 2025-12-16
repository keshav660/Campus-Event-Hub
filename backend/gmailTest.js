// require('dotenv').config();
// const nodemailer = require('nodemailer');

// (async () => {
//   try {
//     console.log("Testing Gmail connection...");
//     console.log("Email:", process.env.EMAIL_USER);
//     console.log("App Password Loaded:", process.env.EMAIL_PASS ? " " : " ");

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     // Verify connection
//     await transporter.verify();
//     console.log("Gmail SMTP connection successful!");

//   } catch (err) {
//     console.error(" Connection failed:", err.message);
//   }
// })();

//-----new------
require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  console.log("Testing Gmail connection...");
  console.log("Email:", process.env.EMAIL_USER);
  console.log("App Password Loaded:", process.env.EMAIL_PASS ? "✅" : "❌ Missing");

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log("❌ Connection failed:", error.message);
    } else {
      console.log("✅ SMTP connection successful!");
    }
  });
})();
