// src/app/guest/checkout/GuestCheckoutClient.tsx
"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface ResvData {
  guestName: string;
  hotelName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  bookingRef: string;
  pendingAmount: number;
}

const theme = {
  bg: "#FFF4EC",
  card: "#FFFFFF",
  border: "#F0C8BF",
  text: "#261815",
  muted: "#7A5A53",
  green: "#1F7A5A",
  orange: "#FF7A45",
  red: "#D94B4B",
};

export default function GuestCheckoutClient({ token }: { token: string }) {
  const [step, setStep] = useState<"loading" | "review" | "submitting" | "done" | "error">("loading");
  const [data, setData] = useState<ResvData | null>(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStep("error");
      setErrMsg("No token provided.");
      return;
    }

    fetch(`${API_URL}/api/chatbot/guest/checkout/preview?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.message ?? "Session invalid");
        setData(json.data);
        setStep("review");
      })
      .catch((e) => {
        setErrMsg(e.message);
        setStep("error");
      });
  }, [token]);

  async function confirmCheckout() {
    setStep("submitting");
    try {
      const res = await fetch(`${API_URL}/api/chatbot/guest/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Checkout failed");
      setStep("done");
    } catch (e: any) {
      setErrMsg(e.message);
      setStep("error");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: theme.card,
          borderRadius: 32,
          border: `1.5px solid ${theme.border}`,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(225,117,92,0.14)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #FF8B5E, #EC5B94)",
            padding: "24px 24px 20px",
            color: "#fff",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              opacity: 0.8,
              textTransform: "uppercase",
            }}
          >
            Express Checkout
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
            {step === "done" ? "✅ Checked Out!" : "🏨 Confirm Checkout"}
          </h1>
          {data && <p style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>{data.hotelName}</p>}
        </div>

        <div style={{ padding: 24 }}>
          {step === "loading" && (
            <p style={{ textAlign: "center", color: theme.muted, fontSize: 14 }}>
              Loading your reservation…
            </p>
          )}

          {step === "review" && data && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {[
                  ["Guest", data.guestName],
                  ["Room", data.roomNumber],
                  ["Booking Ref", data.bookingRef],
                  ["Check-in", new Date(data.checkIn).toLocaleDateString("en-IN")],
                  ["Check-out", new Date(data.checkOut).toLocaleDateString("en-IN")],
                  ["Outstanding", `₹${data.pendingAmount.toLocaleString("en-IN")}`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}
                  >
                    <span style={{ color: theme.muted }}>{label}</span>
                    <span style={{ color: theme.text, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              {data.pendingAmount > 0 && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 16,
                    padding: "12px 16px",
                    marginBottom: 20,
                    fontSize: 13,
                    color: theme.red,
                  }}
                >
                  ⚠️ You have an outstanding balance of{" "}
                  <strong>₹{data.pendingAmount.toLocaleString("en-IN")}</strong>. Please settle at
                  the front desk or we will add it to your card on file.
                </div>
              )}

              <button
                onClick={confirmCheckout}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #1F7A5A, #16A34A)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "14px 0",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 22px rgba(31,122,90,0.28)",
                }}
              >
                ✅ Confirm Express Checkout
              </button>

              <p style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: theme.muted }}>
                Your digital receipt will be sent via WhatsApp / email.
              </p>
            </>
          )}

          {step === "submitting" && (
            <p style={{ textAlign: "center", color: theme.muted, fontSize: 14 }}>
              Processing your checkout…
            </p>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", paddingBottom: 8 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.green }}>All done!</h2>
              <p style={{ marginTop: 8, fontSize: 14, color: theme.muted }}>
                Thank you for staying with us. We hope to see you again soon!
              </p>
            </div>
          )}

          {step === "error" && (
            <div style={{ textAlign: "center", paddingBottom: 8 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
              <p style={{ fontSize: 14, color: theme.red }}>
                {errMsg || "Something went wrong. Please visit the front desk."}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}