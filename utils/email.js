// Enable Babel to handle JSX imports
require("@babel/register")({
  presets: ["@babel/preset-env", "@babel/preset-react"],
});
const AppError = require("./appError");

const React = require("react");
const ReactDOMServer = require("react-dom/server");
const PasswordReset = require("./emailTemplates/PasswordReset").default;

exports.sendEmail = async (email, token, firstname) => {
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    React.createElement(PasswordReset, {
      firstName: firstname,
      token: token,
    }),
  );

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_EMAIL_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Kvizz App",
          email: "darshanvaru2003@gmail.com",
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Kvizz App - Password Reset OTP (Valid for 10mins)",
        htmlContent: htmlContent,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Email sent successfully:", data.messageId);
      return true;
    } else {
      console.error("Error sending email:", data);
      return new AppError(
        "Email Sending Failed, check server logs for error please",
        400,
      );
    }
  } catch (error) {
    console.error("Request failed:", error);
    return new AppError(
      "Email Sending Failed, check server logs for error please",
      400,
    );
  }
};

/*
sendEmail(
  "recipient@example.com",
  "Recipient Name",
  "Your Subject Line",
  "<html><body><h1>Your prepared HTML here</h1></body></html>",
);*/
