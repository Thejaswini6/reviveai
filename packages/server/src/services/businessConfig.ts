/**
 * Reusable Business Profile and Configuration
 * Enables ReviveAI to operate across various small/medium business industries
 */

export interface ServiceOffering {
  id: string;
  name: string;
  description?: string;
  estimated_value_min: number;
  estimated_value_max: number;
  typical_duration_hours?: number;
}

export interface BusinessPolicy {
  deposit_required: boolean;
  warranty_days: number;
  free_inspection: boolean;
  cancellation_notice_hours: number;
  terms_summary: string;
}

export interface RecoverySettings {
  cooldown_hours: number;
  stale_threshold_days: number;
  max_follow_ups: number;
  preferred_channels: ('email' | 'phone')[];
  default_discount_percent?: number;
}

export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  currency: {
    code: string;
    symbol: string;
  };
  services: ServiceOffering[];
  policies: BusinessPolicy;
  recovery_settings: RecoverySettings;
}

/**
 * Default Demonstration Profile: CoolCare AC Services (HVAC)
 */
export const COOLCARE_AC_PROFILE: BusinessProfile = {
  id: 'business-001',
  name: 'CoolCare AC Services',
  industry: 'HVAC / Climate Control',
  description: 'Residential and commercial air conditioning maintenance, repair, installation, and seasonal servicing.',
  email: 'support@coolcare.invalid',
  phone: '+91-12345-67890',
  website: 'https://coolcare.invalid',
  currency: {
    code: 'INR',
    symbol: '₹',
  },
  services: [
    {
      id: 'srv-ac-service',
      name: 'AC servicing',
      description: 'Comprehensive filter cleaning, coil wash, gas pressure inspection, and electrical checks.',
      estimated_value_min: 1500,
      estimated_value_max: 12000,
      typical_duration_hours: 2,
    },
    {
      id: 'srv-ac-repair',
      name: 'AC repair',
      description: 'Diagnosis and component repair including PCB board, capacitor, fan motor, or refrigerant leak refill.',
      estimated_value_min: 2500,
      estimated_value_max: 20000,
      typical_duration_hours: 3,
    },
    {
      id: 'srv-ac-install',
      name: 'AC installation',
      description: 'New unit setup, wall brackets, copper line set installation, vacuuming, and testing.',
      estimated_value_min: 2000,
      estimated_value_max: 50000,
      typical_duration_hours: 4,
    },
  ],
  policies: {
    deposit_required: false,
    warranty_days: 90,
    free_inspection: true,
    cancellation_notice_hours: 4,
    terms_summary: '90-day service warranty on all replacement parts and labor. GST compliant invoicing.',
  },
  recovery_settings: {
    cooldown_hours: 48,
    stale_threshold_days: 3,
    max_follow_ups: 3,
    preferred_channels: ['email', 'phone'],
    default_discount_percent: 5,
  },
};

/**
 * Validation Test Profile: FlowFix Plumbing & Drains (Plumbing Services)
 * Used to verify architectural industry independence
 */
export const FLOWFIX_PLUMBING_PROFILE: BusinessProfile = {
  id: 'business-002',
  name: 'FlowFix Plumbing & Drains',
  industry: 'Plumbing & Drainage',
  description: 'Licensed residential and commercial plumbing repairs, leak detection, drain clearing, and fixture installations.',
  email: 'contact@flowfix.invalid',
  phone: '+91-98765-43210',
  website: 'https://flowfix.invalid',
  currency: {
    code: 'INR',
    symbol: '₹',
  },
  services: [
    {
      id: 'srv-plumb-leak',
      name: 'Emergency leak repair',
      description: 'Fast response pipe repair, concealed leak detection, valve replacements, and pressure troubleshooting.',
      estimated_value_min: 1200,
      estimated_value_max: 8000,
      typical_duration_hours: 2,
    },
    {
      id: 'srv-plumb-drain',
      name: 'Drain clearing & unclogging',
      description: 'Hydro-jetting, mainline snaking, grease trap clearing, and camera pipe inspection.',
      estimated_value_min: 1500,
      estimated_value_max: 6000,
      typical_duration_hours: 2,
    },
    {
      id: 'srv-plumb-heater',
      name: 'Water heater installation',
      description: 'Installation and replacement of geysers, solar water systems, and thermostat diagnostics.',
      estimated_value_min: 2500,
      estimated_value_max: 15000,
      typical_duration_hours: 3,
    },
    {
      id: 'srv-plumb-renov',
      name: 'Bathroom & kitchen plumbing renovation',
      description: 'Complete piping rough-in, sanitary fixture installations, and mixer valve setup.',
      estimated_value_min: 5000,
      estimated_value_max: 40000,
      typical_duration_hours: 8,
    },
  ],
  policies: {
    deposit_required: false,
    warranty_days: 60,
    free_inspection: true,
    cancellation_notice_hours: 2,
    terms_summary: 'Licensed plumbers. 60-day workmanship guarantee. Upfront transparent estimates.',
  },
  recovery_settings: {
    cooldown_hours: 24,
    stale_threshold_days: 2,
    max_follow_ups: 2,
    preferred_channels: ['phone', 'email'],
    default_discount_percent: 5,
  },
};

const PROFILES: Record<string, BusinessProfile> = {
  'business-001': COOLCARE_AC_PROFILE,
  'business-002': FLOWFIX_PLUMBING_PROFILE,
};

/**
 * Retrieve the active business profile (defaults to CoolCare AC Services)
 */
export function getBusinessProfile(businessId = 'business-001'): BusinessProfile {
  return PROFILES[businessId] || COOLCARE_AC_PROFILE;
}
