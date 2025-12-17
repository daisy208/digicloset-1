import { v4 as uuidv4 } from 'uuid';
import mixpanel from 'mixpanel-browser';
import * as amplitude from 'amplitude-js';

interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  brandId?: string;
  role?: string;
  signupDate?: Date;
  lastActive?: Date;
}

interface ConversionFunnelStep {
  step: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.sessionId = uuidv4();
    this.initializeAnalytics();
  }

  private initializeAnalytics() {
    try {
      // Initialize Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.VITE_GA4_MEASUREMENT_ID, {
          session_id: this.sessionId,
          custom_map: {
            custom_parameter_1: 'user_type',
            custom_parameter_2: 'brand_id'
          }
        });
      }

      // Initialize Mixpanel
      if (process.env.VITE_MIXPANEL_TOKEN) {
        mixpanel.init(process.env.VITE_MIXPANEL_TOKEN, {
          debug: process.env.NODE_ENV === 'development',
          track_pageview: true,
          persistence: 'localStorage'
        });
      }

      // Initialize Amplitude
      if (process.env.VITE_AMPLITUDE_API_KEY) {
        amplitude.getInstance().init(process.env.VITE_AMPLITUDE_API_KEY, undefined, {
          includeUtm: true,
          includeReferrer: true,
          trackingOptions: {
            city: false,
            ip_address: false
          }
        });
      }

      // Initialize Hotjar
      if (process.env.VITE_HOTJAR_ID) {
        this.initializeHotjar();
      }

      this.isInitialized = true;
      console.log('Analytics services initialized');
    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }

  private initializeHotjar() {
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj = h.hj || function(...args: any[]) { (h.hj.q = h.hj.q || []).push(args); };
      h._hjSettings = { hjid: process.env.VITE_HOTJAR_ID, hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script'); r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }

  // User identification and properties
  identify(userProperties: UserProperties) {
    this.userId = userProperties.userId;

    try {
      // Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.VITE_GA4_MEASUREMENT_ID, {
          user_id: userProperties.userId,
          custom_map: {
            user_type: userProperties.role,
            brand_id: userProperties.brandId
          }
        });
      }

      // Mixpanel
      if (mixpanel.get_distinct_id) {
        mixpanel.identify(userProperties.userId);
        mixpanel.people.set({
          '$email': userProperties.email,
          '$name': userProperties.name,
          'role': userProperties.role,
          'brand_id': userProperties.brandId,
          'signup_date': userProperties.signupDate
        });
      }

      // Amplitude
      if (amplitude.getInstance().setUserId) {
        amplitude.getInstance().setUserId(userProperties.userId);
        amplitude.getInstance().setUserProperties({
          email: userProperties.email,
          name: userProperties.name,
          role: userProperties.role,
          brand_id: userProperties.brandId
        });
      }

      console.log('User identified:', userProperties.userId);
    } catch (error) {
      console.error('User identification failed:', error);
    }
  }

  // Track events
  track(eventName: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized');
      return;
    }

    const eventData: AnalyticsEvent = {
      eventName,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        page_title: document.title
      },
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      timestamp: new Date()
    };

    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
          ...properties,
          session_id: this.sessionId,
          user_id: this.userId
        });
      }

      // Mixpanel
      if (mixpanel.track) {
        mixpanel.track(eventName, eventData.properties);
      }

      // Amplitude
      if (amplitude.getInstance().logEvent) {
        amplitude.getInstance().logEvent(eventName, eventData.properties);
      }

      // Send to backend for storage
      this.sendToBackend(eventData);

      console.log('Event tracked:', eventName, properties);
    } catch (error) {
      console.error('Event tracking failed:', error);
    }
  }

  // Page view tracking
  trackPageView(pageName: string, properties: Record<string, any> = {}) {
    this.track('page_view', {
      page_name: pageName,
      ...properties
    });
  }

  // Virtual try-on specific events
  trackTryOnStart(clothingItems: any[], userPhoto: string) {
    this.track('try_on_started', {
      item_count: clothingItems.length,
      item_ids: clothingItems.map(item => item.id),
      item_categories: clothingItems.map(item => item.category),
      has_user_photo: !!userPhoto
    });
  }

  trackTryOnComplete(clothingItems: any[], processingTime: number) {
    this.track('try_on_completed', {
      item_count: clothingItems.length,
      processing_time_ms: processingTime,
      item_ids: clothingItems.map(item => item.id)
    });
  }

  trackItemSelection(item: any, source: string = 'catalog') {
    this.track('item_selected', {
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_price: item.price,
      item_brand: item.brand,
      selection_source: source
    });
  }

  trackConversion(items: any[], totalValue: number, conversionType: string = 'purchase') {
    this.track('conversion', {
      conversion_type: conversionType,
      item_count: items.length,
      total_value: totalValue,
      item_ids: items.map(item => item.id),
      currency: 'USD'
    });
  }

  trackAIRecommendation(recommendedItems: any[], userPreferences: any) {
    this.track('ai_recommendation_shown', {
      recommendation_count: recommendedItems.length,
      recommended_item_ids: recommendedItems.map(item => item.id),
      user_style_preferences: userPreferences.preferredStyles,
      user_color_preferences: userPreferences.favoriteColors
    });
  }

  // A/B Testing
  trackExperiment(experimentName: string, variant: string, properties: Record<string, any> = {}) {
    this.track('experiment_viewed', {
      experiment_name: experimentName,
      variant,
      ...properties
    });
  }

  // Error tracking
  trackError(error: Error, context: Record<string, any> = {}) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context
    });
  }

  // Performance tracking
  trackPerformance(metricName: string, value: number, unit: string = 'ms') {
    this.track('performance_metric', {
      metric_name: metricName,
      value,
      unit
    });
  }

  // Send events to backend for storage and analysis
  private async sendToBackend(eventData: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth_token') && {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          })
        },
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      console.error('Failed to send event to backend:', error);
    }
  }

  // Get analytics data
  async getAnalyticsData(dateRange: { start: Date; end: Date }, metrics: string[] = []) {
    try {
      const response = await fetch('/api/analytics/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          metrics
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      return null;
    }
  }

  // Conversion funnel analysis
  async getConversionFunnel(dateRange: { start: Date; end: Date }): Promise<ConversionFunnelStep[]> {
    try {
      const response = await fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString()
        })
      });

      const data = await response.json();
      return data.funnel || [];
    } catch (error) {
      console.error('Failed to fetch conversion funnel:', error);
      return [];
    }
  }

  // Real-time analytics
  async getRealTimeMetrics() {
    try {
      const response = await fetch('/api/analytics/realtime', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
      return null;
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsService();

// React hook for analytics
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    identify: analytics.identify.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackTryOnStart: analytics.trackTryOnStart.bind(analytics),
    trackTryOnComplete: analytics.trackTryOnComplete.bind(analytics),
    trackItemSelection: analytics.trackItemSelection.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackAIRecommendation: analytics.trackAIRecommendation.bind(analytics),
    trackExperiment: analytics.trackExperiment.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics)
  };
};

export default analytics;