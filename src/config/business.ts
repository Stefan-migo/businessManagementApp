/**
 * Business Configuration
 * 
 * This file contains all business-specific configuration that should be
 * customized when adapting this system to a new business.
 */

export const businessConfig = {
  // Business Information
  name: "Your Business Name",
  displayName: "Your Business Display Name",
  tagline: "Your Business Tagline",
  contactEmail: "admin@yourbusiness.com",
  
  // Branding
  colors: {
    primary: "#8B5A3C",
    secondary: "#B17A47",
    accent: "#D4A574",
    success: "#4ade80",
    warning: "#fbbf24",
    danger: "#ef4444",
    info: "#60a5fa",
  },
  
  // Admin Panel
  admin: {
    title: "Admin Panel",
    subtitle: "Business Management System",
    logo: "/logo.svg", // Path to your logo
  },
  
  // Features
  features: {
    products: true,
    orders: true,
    customers: true,
    support: true,
    analytics: true,
    reviews: true,
    categories: true,
  },
  
  // Currency
  currency: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
  },
  
  // Email Configuration
  emailConfig: {
    from: "noreply@yourbusiness.com",
    replyTo: "support@yourbusiness.com",
    templates: {
      orderConfirmation: true,
      orderShipped: true,
      orderDelivered: true,
      supportTicketCreated: true,
      supportTicketUpdated: true,
    },
  },
  
  // Support System
  support: {
    enabled: true,
    categories: [
      "General Inquiry",
      "Order Issue",
      "Product Question",
      "Technical Support",
      "Billing",
      "Other",
    ],
  },
  
  // Shipping
  shipping: {
    enabled: true,
    defaultCarrier: "Standard Shipping",
  },
  
  // Analytics
  analytics: {
    enabled: true,
    trackRevenue: true,
    trackOrders: true,
    trackCustomers: true,
  },
};

export default businessConfig;

