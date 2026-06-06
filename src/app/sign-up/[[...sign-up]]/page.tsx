import { SignUp } from "@clerk/nextjs";

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

export default function SignUpPage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at top left, var(--bg-secondary), var(--bg-primary) 60%)",
      padding: "20px",
      transition: "background 0.2s ease"
    }}>
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          margin: "0 0 8px 0",
          letterSpacing: "-0.03em",
          fontFamily: "var(--font-display)"
        }}>
          Vendor<span style={{ color: "var(--accent-primary)" }}>Bridge</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>
          Procurement & Vendor Management ERP
        </p>
      </div>
      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
