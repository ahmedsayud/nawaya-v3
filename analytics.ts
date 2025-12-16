export interface ActivityEvent {
  id: string;
  type: string;
  timestamp: string;
  details: Record<string, any>;
  userId?: number;
  userName?: string;
  location?: string; // Mock location
}

const MOCK_LOCATIONS = ['المملكة العربية السعودية', 'الإمارات العربية المتحدة', 'الكويت', 'مصر', 'الأردن', 'قطر', 'البحرين'];

export const trackEvent = (type: string, details: Record<string, any> = {}, user?: { id: number; fullName: string }) => {
  try {
    const events = getEvents();
    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}-${Math.random()}`,
      type,
      details,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      userName: user?.fullName || 'زائر',
      location: MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)],
    };
    events.unshift(newEvent);
    // Keep only the last 100 events
    localStorage.setItem('userActivityLog', JSON.stringify(events.slice(0, 100)));
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

export const getEvents = (): ActivityEvent[] => {
  try {
    const storedEvents = localStorage.getItem('userActivityLog');
    return storedEvents ? JSON.parse(storedEvents) : [];
  } catch (error) {
    console.error('Failed to get events:', error);
    return [];
  }
};
