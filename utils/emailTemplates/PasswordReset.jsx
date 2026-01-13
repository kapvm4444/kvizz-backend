import React from "react";

function PasswordReset({ firstName, token }) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f4f4",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ color: "#333333" }}>Kvizz App</h1>
        </div>
        <div style={{ color: "#555555", fontSize: "16px", lineHeight: "1.5" }}>
          <p>Hi {firstName},</p>
          <p>
            You requested to reset your password. Use the verification code
            below to complete the process. This code is valid for 10 minutes.
          </p>
          <div
            style={{
              backgroundColor: "#f0f8ff",
              border: "1px solid #cce7ff",
              borderRadius: "4px",
              padding: "15px",
              textAlign: "center",
              margin: "20px 0",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#7907FF",
                letterSpacing: "4px",
              }}
            >
              {token}
            </span>
          </div>
          <p>
            If you didn't request this, please ignore this email. Your password
            will remain unchanged.
          </p>
        </div>
        <div
          style={{
            marginTop: "30px",
            textAlign: "center",
            fontSize: "12px",
            color: "#999999",
          }}
        >
          <p>
            &copy; {new Date().getFullYear()} Kvizz App. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
