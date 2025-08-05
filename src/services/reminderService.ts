import { getTimeEntries } from './storage';
import { getAllUsers } from '@/lib/auth';

export interface Reminder {
  id: string;
  userId: string;
  type: 'daily' | 'weekly' | 'monthly';
  message: string;
  date: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReminderSettings {
  dailyEnabled: boolean;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  dailyTime: string; // Format: "18:00"
  weeklyDay: number; // 0-6, Sunday = 0
  weeklyTime: string;
  monthlyDay: number; // 1-31
  monthlyTime: string;
}

const REMINDERS_KEY = 'timeflow_reminders';
const REMINDER_SETTINGS_KEY = 'timeflow_reminder_settings';
const LAST_CHECK_KEY = 'timeflow_last_reminder_check';

// Default reminder settings
const DEFAULT_SETTINGS: ReminderSettings = {
  dailyEnabled: true,
  weeklyEnabled: true,
  monthlyEnabled: true,
  dailyTime: "18:00",
  weeklyDay: 5, // Friday
  weeklyTime: "17:00",
  monthlyDay: 1, // 1st of month
  monthlyTime: "09:00"
};

export const getReminderSettings = (): ReminderSettings => {
  const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
};

export const saveReminderSettings = (settings: ReminderSettings): void => {
  localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
};

export const getReminders = (): Reminder[] => {
  const stored = localStorage.getItem(REMINDERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveReminders = (reminders: Reminder[]): void => {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

export const markReminderAsRead = (reminderId: string): void => {
  const reminders = getReminders();
  const updatedReminders = reminders.map(reminder =>
    reminder.id === reminderId ? { ...reminder, isRead: true } : reminder
  );
  saveReminders(updatedReminders);
};

export const getUnreadReminders = (userId?: string): Reminder[] => {
  const reminders = getReminders();
  return reminders.filter(reminder => 
    !reminder.isRead && 
    (!userId || reminder.userId === userId)
  );
};

export const deleteOldReminders = (): void => {
  const reminders = getReminders();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const filteredReminders = reminders.filter(reminder => 
    new Date(reminder.createdAt) > thirtyDaysAgo
  );
  
  saveReminders(filteredReminders);
};

export const hasTimeEntryForDate = (userId: string, date: string): boolean => {
  const timeEntries = getTimeEntries();
  return timeEntries.some(entry => 
    entry.userId === userId && entry.date === date
  );
};

export const hasTimeEntriesForWeek = (userId: string, year: number, week: number): boolean => {
  const timeEntries = getTimeEntries();
  
  // Get start of week (Monday)
  const startOfWeek = getStartOfWeek(year, week);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return timeEntries.some(entry => {
    if (entry.userId !== userId) return false;
    const entryDate = new Date(entry.date);
    return entryDate >= startOfWeek && entryDate <= endOfWeek;
  });
};

export const hasTimeEntriesForMonth = (userId: string, year: number, month: number): boolean => {
  const timeEntries = getTimeEntries();
  
  return timeEntries.some(entry => {
    if (entry.userId !== userId) return false;
    const entryDate = new Date(entry.date);
    return entryDate.getFullYear() === year && entryDate.getMonth() === month;
  });
};

const getStartOfWeek = (year: number, week: number): Date => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
};

const getCurrentWeek = (): { year: number; week: number } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return { year: now.getFullYear(), week };
};

const createReminder = (userId: string, type: 'daily' | 'weekly' | 'monthly', message: string, date?: string): Reminder => {
  return {
    id: `${type}_${userId}_${Date.now()}`,
    userId,
    type,
    message,
    date: date || new Date().toISOString().split('T')[0],
    isRead: false,
    createdAt: new Date().toISOString()
  };
};

export const checkAndCreateReminders = (): void => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
  
  // Only check once per hour to avoid spam
  if (now.getTime() - lastCheckDate.getTime() < 60 * 60 * 1000) {
    return;
  }
  
  localStorage.setItem(LAST_CHECK_KEY, now.toISOString());
  
  const settings = getReminderSettings();
  const users = getAllUsers();
  const existingReminders = getReminders();
  const newReminders: Reminder[] = [];
  
  users.forEach(user => {
  // Daily reminders - send reminder if no entry before 6 PM
    if (settings.dailyEnabled) {
      const isAfter6PM = currentTime >= "18:00";

      // Check for today's entries and send reminder
      if (isAfter6PM && !hasTimeEntryForDate(user.id, today)) {
        const existingTodayDaily = existingReminders.find(r => 
          r.userId === user.id && 
          r.type === 'daily' && 
          r.date === today
        );

        if (!existingTodayDaily) {
          newReminders.push(createReminder(
            user.id,
            'daily',
            `🕐 Reminder: Please log your time for today (${new Date().toLocaleDateString()})!`
          ));
        }
      }
    }
    
    // Weekly reminders (check on specified day)
    if (settings.weeklyEnabled && now.getDay() === settings.weeklyDay && currentTime >= settings.weeklyTime) {
      const { year, week } = getCurrentWeek();
      const lastWeek = week - 1;
      const lastWeekYear = lastWeek < 1 ? year - 1 : year;
      const adjustedWeek = lastWeek < 1 ? 52 : lastWeek;
      
      if (!hasTimeEntriesForWeek(user.id, lastWeekYear, adjustedWeek)) {
        // Check if we already sent a weekly reminder for this week
        const weekKey = `${lastWeekYear}-W${adjustedWeek}`;
        const existingWeekly = existingReminders.find(r => 
          r.userId === user.id && 
          r.type === 'weekly' && 
          r.date.includes(weekKey)
        );
        
        if (!existingWeekly) {
          newReminders.push(createReminder(
            user.id,
            'weekly',
            `📅 Weekly Reminder: You haven't logged any time entries for last week (Week ${adjustedWeek}). Please update your timesheet.`
          ));
        }
      }
    }
    
    // Monthly reminders (check on specified day of month)
    if (settings.monthlyEnabled && now.getDate() === settings.monthlyDay && currentTime >= settings.monthlyTime) {
      const lastMonth = now.getMonth() - 1;
      const lastMonthYear = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = lastMonth < 0 ? 11 : lastMonth;
      
      if (!hasTimeEntriesForMonth(user.id, lastMonthYear, adjustedMonth)) {
        // Check if we already sent a monthly reminder for this month
        const monthKey = `${lastMonthYear}-${adjustedMonth}`;
        const existingMonthly = existingReminders.find(r => 
          r.userId === user.id && 
          r.type === 'monthly' && 
          r.date.includes(monthKey)
        );
        
        if (!existingMonthly) {
          const monthName = new Date(lastMonthYear, adjustedMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          newReminders.push(createReminder(
            user.id,
            'monthly',
            `📊 Monthly Reminder: You haven't logged any time entries for ${monthName}. Please complete your monthly timesheet.`
          ));
        }
      }
    }
  });
  
  if (newReminders.length > 0) {
    const allReminders = [...existingReminders, ...newReminders];
    saveReminders(allReminders);
  }
  
  // Clean up old reminders
  deleteOldReminders();
};

// Initialize reminder checking when service is imported
export const startReminderService = (): void => {
  // Check reminders immediately
  checkAndCreateReminders();
  
  // Set up interval to check every hour
  setInterval(checkAndCreateReminders, 60 * 60 * 1000);
};
