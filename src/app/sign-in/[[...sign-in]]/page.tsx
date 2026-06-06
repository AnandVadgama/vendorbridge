'use client';

import { SignIn } from "@clerk/nextjs";
import { useState } from "react";
import { Clipboard, Check, Shield, User, FileText, ClipboardList } from "lucide-react";

const clerkAppearance = {
  variables: {
    colorPrimary: '#10b981', // emerald accent
    colorBackground: 'var(--bg-card)',
    colorText: 'var(--text-primary)',
    colorTextSecondary: 'var(--text-secondary)',
    colorInputBackground: 'var(--bg-input)',
    colorInputText: 'var(--text-primary)',
    colorBorder: 'var(--border-color)',
    colorRing: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 'var(--radius-md)',
  },
  elements: {
    card: {
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg)',
    },
    headerTitle: {
      color: 'var(--text-primary)',
      fontWeight: '700',
    },
    headerSubtitle: {
      color: 'var(--text-secondary)',
    },
    socialButtonsBlockButton: {
      backgroundColor: 'var(--bg-input)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
      '&:hover': {
        backgroundColor: 'var(--border-color)',
      }
    },
    formFieldLabel: {
      color: 'var(--text-secondary)',
    },
    formFieldInput: {
      border: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-input)',
      color: 'var(--text-primary)',
      '&:focus': {
        borderColor: 'var(--border-focus)',
      }
    },
    footerActionText: {
      color: 'var(--text-muted)',
    },
    footerActionLink: {
      color: 'var(--accent-primary)',
      '&:hover': {
        color: 'var(--accent-primary-hover)',
      }
    }
  }
};

const rolesInfo = [
  {
    title: "Procurement Officer",
    icon: FileText,
    color: "#3b82f6",
    credentials: { email: "officer@vendorbridge.com", password: "officer123" },
    features: [
      "Create RFQs",
      "Compare quotations",
      "Generate purchase orders",
      "Generate invoices"
    ]
  },
  {
    title: "Vendor",
    icon: ClipboardList,
    color: "#10b981",
    credentials: { email: "vendor@vendorbridge.com", password: "vendor123" },
    features: [
      "Submit quotations",
      "Track RFQ status",
      "View purchase orders"
    ]
  },
  {
    title: "Manager / Approver",
    icon: User,
    color: "#f59e0b",
    credentials: { email: "manager@vendorbridge.com", password: "manager123" },
    features: [
      "Approve/reject requests",
      "Monitor workflows"
    ]
  },
  {
    title: "Admin",
    icon: Shield,
    color: "#a855f7",
    credentials: { email: "admin@vendorbridge.com", password: "admin123" },
    features: [
      "Manage users & vendors",
      "View procurement analytics"
    ]
  }
];

export default function SignInPage() {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, var(--bg-secondary), var(--bg-primary) 60%)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-body)",
      padding: "40px 20px",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.2s ease"
    }}>
      {/* Brand Header */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{
          fontSize: "2.8rem",
          fontWeight: 800,
          margin: "0 0 8px 0",
          letterSpacing: "-0.03em",
          fontFamily: "var(--font-display)"
        }}>
          Vendor<span style={{ color: "var(--accent-primary)" }}>Bridge</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", margin: 0, fontWeight: 500 }}>
          Centralized B2B Procurement & Vendor Management ERP
        </p>
      </div>

      {/* Grid Container */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        maxWidth: "1100px",
        width: "100%",
        gap: "40px",
        alignItems: "stretch",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        {/* Left Side: Role Selector & Capabilities */}
        <div style={{
          flex: "1 1 500px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "30px",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          <div>
            <h2 style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              marginBottom: "8px"
            }}>
              Quick Review Access
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
              Click on any role to copy credentials and test its dedicated workflow dashboard:
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {rolesInfo.map((role, idx) => {
              const Icon = role.icon;
              return (
                <div key={idx} style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  backgroundColor: "var(--bg-input)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  transition: "all 0.2s ease"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: `${role.color}15`,
                        color: role.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Icon size={16} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{role.title}</span>
                    </div>
                    
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(role.credentials.email)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.75rem",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-xs)",
                        backgroundColor: copiedEmail === role.credentials.email ? "var(--accent-primary)" : "var(--border-color)",
                        color: copiedEmail === role.credentials.email ? "var(--text-inverse)" : "var(--text-primary)",
                        fontWeight: 600,
                        transition: "all var(--transition-fast)",
                        cursor: "pointer"
                      }}
                    >
                      {copiedEmail === role.credentials.email ? (
                        <>
                          <Check size={12} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Clipboard size={12} />
                          <span>Use Demo Details</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Credentials hint */}
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Email: <code style={{ color: "var(--text-primary)", fontWeight: 600 }}>{role.credentials.email}</code>
                    <span style={{ margin: "0 8px" }}>|</span>
                    Password: <code style={{ color: "var(--text-primary)", fontWeight: 600 }}>{role.credentials.password}</code>
                  </div>

                  {/* Features List */}
                  <ul style={{
                    margin: 0,
                    paddingLeft: "20px",
                    fontSize: "0.825rem",
                    color: "var(--text-secondary)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px"
                  }}>
                    {role.features.map((feat, fIdx) => (
                      <li key={fIdx} style={{ listStyleType: "disc" }}>{feat}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Clerk SignIn Card */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "1 1 400px"
        }}>
          <SignIn appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  );
}
