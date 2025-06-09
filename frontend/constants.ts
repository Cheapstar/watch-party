export const LIGHT_THEME = {
  background: "#FEFEFE", // Pure white with subtle warmth
  surface: "#F8FAFC", // Soft blue-gray surface
  surfaceElevated: "#FFFFFF", // Pure white for elevated elements
  border: "#E2E8F0", // Soft slate border
  borderFocus: "#CBD5E1", // Darker focus state
  textPrimary: "#0F172A", // Rich dark slate
  textSecondary: "#64748B", // Balanced gray-blue
  textMuted: "#94A3B8", // Light gray-blue
  accent: "#3B82F6", // Vibrant blue (blue-500)
  accentHover: "#2563EB", // Deeper blue hover
  accentLight: "#DBEAFE", // Light blue background

  // Success, warning, error colors
  success: "#10B981", // Emerald
  successLight: "#D1FAE5",
  warning: "#F59E0B", // Amber
  warningLight: "#FEF3C7",
  error: "#EF4444", // Red
  errorLight: "#FEE2E2",

  button: {
    primary: {
      background: "#3B82F6",
      text: "#FFFFFF",
      hover: "#2563EB",
      border: "transparent",
    },
    secondary: {
      background: "#F1F5F9",
      text: "#475569",
      hover: "#E2E8F0",
      border: "#E2E8F0",
    },
    ghost: {
      background: "transparent",
      text: "#64748B",
      hover: "#F1F5F9",
      border: "transparent",
    },
  },

  icon: {
    default: "#64748B",
    hover: "#475569",
    accent: "#3B82F6",
    muted: "#94A3B8",
  },

  liveChat: {
    background: "#FFFFFF",
    message: {
      user: "#3B82F6",
      userText: "#FFFFFF",
      other: "#F1F5F9",
      otherText: "#1E293B",
    },
    input: {
      background: "#F8FAFC",
      border: "#E2E8F0",
      focus: "#3B82F6",
    },
  },

  userBlock: {
    background: "#FFFFFF",
    backgroundHover: "#F8FAFC",
    text: "#1E293B",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    avatar: {
      background: "#3B82F6",
      text: "#FFFFFF",
    },
  },

  menu: {
    background: "#FFFFFF",
    backgroundHover: "#F8FAFC",
    text: "#1E293B",
    textSecondary: "#64748B",
    divider: "#E2E8F0",
    active: "#DBEAFE",
    activeText: "#1D4ED8",
  },

  status: {
    online: "#10B981",
    busy: "#EF4444",
    away: "#F59E0B",
    offline: "#94A3B8",
  },

  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  gradient: {
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    accent: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    subtle: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
  },
};

export const DARK_THEME = {
  background: "#0F172A", // Rich dark slate
  surface: "#1E293B", // Lighter slate surface
  surfaceElevated: "#334155", // Elevated surface
  border: "#334155", // Slate border
  borderFocus: "#475569", // Focus border
  textPrimary: "#F8FAFC", // Near white
  textSecondary: "#CBD5E1", // Light slate
  textMuted: "#64748B", // Muted slate
  accent: "#60A5FA", // Lighter blue for dark mode
  accentHover: "#3B82F6", // Standard blue hover
  accentLight: "#1E3A8A", // Dark blue background

  // Success, warning, error colors (adjusted for dark mode)
  success: "#34D399", // Light emerald
  successLight: "#064E3B",
  warning: "#FBBF24", // Light amber
  warningLight: "#78350F",
  error: "#F87171", // Light red
  errorLight: "#7F1D1D",

  button: {
    primary: {
      background: "#3B82F6",
      text: "#FFFFFF",
      hover: "#2563EB",
      border: "transparent",
    },
    secondary: {
      background: "#374151",
      text: "#D1D5DB",
      hover: "#4B5563",
      border: "#4B5563",
    },
    ghost: {
      background: "transparent",
      text: "#9CA3AF",
      hover: "#374151",
      border: "transparent",
    },
  },

  icon: {
    default: "#9CA3AF",
    hover: "#D1D5DB",
    accent: "#60A5FA",
    muted: "#6B7280",
  },

  liveChat: {
    background: "#1E293B",
    message: {
      user: "#3B82F6",
      userText: "#FFFFFF",
      other: "#374151",
      otherText: "#E5E7EB",
    },
    input: {
      background: "#374151",
      border: "#4B5563",
      focus: "#60A5FA",
    },
  },

  userBlock: {
    background: "#1E293B",
    backgroundHover: "#334155",
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    border: "#475569",
    avatar: {
      background: "#3B82F6",
      text: "#FFFFFF",
    },
  },

  menu: {
    background: "#1E293B",
    backgroundHover: "#334155",
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    divider: "#475569",
    active: "#1E3A8A",
    activeText: "#60A5FA",
  },

  status: {
    online: "#34D399",
    busy: "#F87171",
    away: "#FBBF24",
    offline: "#6B7280",
  },

  gradient: {
    primary: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
    accent: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
    subtle: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
  },
};
