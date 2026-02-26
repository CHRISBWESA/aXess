// Centralized barrel file for all Feather icons used across the aXess app

import {
  FiHome,
  FiKey,
  FiFileText,
  FiBarChart,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiSearch,
  FiBell,
  FiUsers,
  FiLock,
  FiInfo,
  FiPlus,
  FiEdit,
  FiTrash,
  FiSend,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiSun,
  FiMoon,
  FiMonitor,
  FiChevronLeft,
  FiChevronRight,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiUser,
  FiFilter,
  // NEW: used in Reports & Requests pages
  FiAlertTriangle,
  FiRefreshCw,
  FiShield,
  FiUserCheck,
  FiActivity,
} from 'react-icons/fi';

export const Icons = {
  // Navigation / Sidebar
  Home:        FiHome,
  Key:         FiKey,
  FileText:    FiFileText,
  BarChart:    FiBarChart,
  Settings:    FiSettings,
  HelpCircle:  FiHelpCircle,
  LogOut:      FiLogOut,

  // Header / Common UI
  Search:  FiSearch,
  Bell:    FiBell,
  X:       FiX,

  // Stats / Dashboard
  Users: FiUsers,
  Lock:  FiLock,

  // Misc / Utility
  Info:         FiInfo,
  AlertCircle:  FiAlertCircle,
  CheckCircle:  FiCheckCircle,
  XCircle:      FiXCircle,

  // Rooms page actions
  Plus:  FiPlus,
  Edit:  FiEdit,
  Trash: FiTrash,

  // Forms / Submit / Contact
  Send: FiSend,
  Mail: FiMail,

  // Appearance / theme
  Paintbrush: FiEdit,
  Sun:        FiSun,
  Moon:       FiMoon,
  Monitor:    FiMonitor,

  // Sidebar toggle
  ChevronLeft:  FiChevronLeft,
  ChevronRight: FiChevronRight,

  // Help & Support
  Phone:  FiPhone,
  MapPin: FiMapPin,

  // Reports & Requests
  Calendar: FiCalendar,
  Clock:    FiClock,
  User:     FiUser,
  Filter:   FiFilter,

  // NEW — pending approval modal + admin request labels
  AlertTriangle: FiAlertTriangle,  // Urgent notification / warning
  RefreshCw:     FiRefreshCw,      // Return / cycle icon for timestamps
  Shield:        FiShield,         // Admin badge pill
  UserCheck:     FiUserCheck,      // Admin acting as user
  Activity:      FiActivity,       // Recent activity sidebar header
} as const;