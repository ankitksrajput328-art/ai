/**
 * Nexus AI Analytics Service
 * Handles event tracking, token estimation, and cost monitoring.
 */

const AnalyticsService = {
    events: [],
    
    // Pricing Config (per 1M tokens as of Gemini 1.5 Pro)
    PRICING: {
        INPUT: 3.50,  // USD per 1M tokens
        OUTPUT: 10.50 // USD per 1M tokens
    },

    /**
     * Tracks a custom event
     * @param {string} type - Event type (e.g., 'voice_activated')
     * @param {object} metadata - Extra details
     */
    trackEvent(type, metadata = {}) {
        const event = {
            id: crypto.randomUUID(),
            type,
            payload: metadata,
            platform: this.getPlatform(),
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        console.log(`[Analytics] Tracked: ${type}`, event);
        
        // In production: Send to /api/v1/analytics/track
        this.syncWithServer(event);
    },

    /**
     * Logs API usage and estimates cost
     */
    logUsage(model, promptText, completionText, latency) {
        // Mock token counting (Approx 4 chars per token)
        const promptTokens = Math.ceil(promptText.length / 4);
        const completionTokens = Math.ceil(completionText.length / 4);
        
        const cost = (
            (promptTokens / 1000000) * this.PRICING.INPUT + 
            (completionTokens / 1000000) * this.PRICING.OUTPUT
        );

        const logEntry = {
            model,
            promptTokens,
            completionTokens,
            costUSD: cost.toFixed(6),
            latencyMS: latency,
            timestamp: new Date().toISOString()
        };

        console.log(`[API Metrics] Usage logged`, logEntry);
        this.trackEvent('api_usage', logEntry);
    },

    /**
     * Captures system errors
     */
    reportCrash(error, stack) {
        const report = {
            message: error.message,
            stack: stack || error.stack,
            url: window.location.href,
            platform: this.getPlatform()
        };
        
        this.trackEvent('system_crash', report);
    },

    getPlatform() {
        if (window.innerWidth < 768) return 'mobile_web';
        return 'desktop_web';
    },

    async syncWithServer(event) {
        // Simulated network call
        try {
            // await fetch('/api/v1/analytics', { method: 'POST', body: JSON.stringify(event) });
        } catch (e) {}
    }
};

// Global error hook
window.addEventListener('error', (event) => {
    AnalyticsService.reportCrash(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    AnalyticsService.reportCrash(new Error(event.reason));
});
