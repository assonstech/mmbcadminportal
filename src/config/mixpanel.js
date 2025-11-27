import mixpanel from 'mixpanel-browser';

// Replace with your real Mixpanel project token
const MIXPANEL_TOKEN = '849fb551d97df1ce79fcb237e31f0455';

// Initialize Mixpanel once
mixpanel.init(MIXPANEL_TOKEN, {
  debug: true,              // shows logs in console
  track_pageview: true,
  persistence: 'localStorage',
  autocapture: true,
  record_sessions_percent: 100,
  record_heatmap_data: true,
});

export default mixpanel;
