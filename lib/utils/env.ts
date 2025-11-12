// Environment Configuration Utilities
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export function getOptionalEnvVar(name: string, defaultValue: string = ""): string {
  return process.env[name] || defaultValue;
}

export const ENV_CONFIG = {
  // Database
  MONGODB_URI: getRequiredEnvVar("MONGODB_URI"),
  
  // Authentication
  NEXTAUTH_URL: getOptionalEnvVar("NEXTAUTH_URL", "http://localhost:3000"),
  NEXTAUTH_SECRET: getRequiredEnvVar("NEXTAUTH_SECRET"),
  JWT_SECRET: getRequiredEnvVar("JWT_SECRET"),
  
  // OAuth (optional)
  GOOGLE_CLIENT_ID: getOptionalEnvVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getOptionalEnvVar("GOOGLE_CLIENT_SECRET"),
  
  // Environment
  NODE_ENV: getOptionalEnvVar("NODE_ENV", "development"),
  
  // Check if all required variables are set
  isConfigValid: () => {
    try {
      getRequiredEnvVar("MONGODB_URI");
      getRequiredEnvVar("NEXTAUTH_SECRET");
      getRequiredEnvVar("JWT_SECRET");
      return true;
    } catch {
      return false;
    }
  }
} as const;