// MaintenancePage.jsx
import React from "react";

export default function MaintenancePage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🚧</div>

        <h1 style={styles.title}>We’re Under Maintenance</h1>

        <p style={styles.subtitle}>
          Our website is currently undergoing scheduled maintenance.
          <br />
          We’ll be back shortly. Thanks for your patience 🙏
        </p>

        <div style={styles.loader}></div>

        <p style={styles.footer}>© NagarPrishad Arwal</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    textAlign: "center",
    background: "#fff",
    padding: "40px 30px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    maxWidth: "400px",
    width: "90%",
    animation: "fadeIn 1s ease-in-out",
  },
  icon: {
    fontSize: "60px",
    marginBottom: "10px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "25px",
    lineHeight: "1.5",
  },
  loader: {
    margin: "20px auto",
    width: "40px",
    height: "40px",
    border: "4px solid #eee",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#aaa",
  },
};