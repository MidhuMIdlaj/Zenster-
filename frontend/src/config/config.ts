interface FrontendConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  app: {
    name: string;
    env: 'development' | 'production' | 'test';
  };
  features: {
    enableNotifications: boolean;
    enableVideoCall: boolean;
    enableChat: boolean;
  };
}

class ConfigManager {
  private config: FrontendConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): FrontendConfig {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const env = (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test';

    return {
      api: {
        baseUrl: apiBaseUrl,
        timeout: 30000,
      },
      app: {
        name: 'Zenster',
        env,
      },
      features: {
        enableNotifications: true,
        enableVideoCall: true,
        enableChat: true,
      },
    };
  }

  private validateConfig(): void {
    if (!this.config.api.baseUrl) {
      console.error(
        'Missing API base URL. Please set VITE_API_BASE_URL in your .env file'
      );
    }
  }

  getConfig(): Readonly<FrontendConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get API base URL - used by all API services
   */
  getApiBaseUrl(): string {
    return this.config.api.baseUrl;
  }

  /**
   * Get API endpoint URL - convenience method for building full URLs
   */
  getApiEndpoint(path: string): string {
    const baseUrl = this.config.api.baseUrl;
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.app.env === 'development';
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.app.env === 'production';
  }
}

export const configManager = new ConfigManager();
export const config = configManager.getConfig();

// For backward compatibility with default export
export default {
  apiUrl: configManager.getApiBaseUrl(),
  getApiEndpoint: (path: string) => configManager.getApiEndpoint(path),
  isDevelopment: () => configManager.isDevelopment(),
  isProduction: () => configManager.isProduction(),
};