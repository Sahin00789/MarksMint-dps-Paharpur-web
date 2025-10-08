import { format, parse, isValid, parseISO, isDate } from 'date-fns';

/**
 * Safely parse a date string to a Date object
 * @param {string|Date} date - The date string or Date object to parse
 * @param {string} [formatString] - Optional format string if the date is not in ISO format
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export const safeParseDate = (date, formatString) => {
  if (!date) return null;
  
  // If it's already a Date object and valid, return it
  if (isDate(date) && !isNaN(date)) return date;
  
  try {
    // Try parsing as ISO date first
    if (typeof date === 'string') {
      // Try parsing as ISO format
      const isoDate = parseISO(date);
      if (isValid(isoDate)) return isoDate;
      
      // If format string is provided, try parsing with it
      if (formatString) {
        const parsedDate = parse(date, formatString, new Date());
        if (isValid(parsedDate)) return parsedDate;
      }
      
      // Try common date formats
      const formats = [
        'dd/MM/yyyy',
        'MM/dd/yyyy',
        'yyyy-MM-dd',
        'dd-MM-yyyy',
        'MM/dd/yy',
        'dd-MMM-yyyy',
      ];
      
      for (const fmt of formats) {
        const parsedDate = parse(date, fmt, new Date());
        if (isValid(parsedDate)) return parsedDate;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Format a date to the specified format
 * @param {string|Date} date - The date to format
 * @param {string} formatString - The format string (default: 'dd/MM/yyyy')
 * @returns {string} Formatted date string or empty string if invalid
 */
export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '';
  
  try {
    return format(parsedDate, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date with day name (e.g., "15-Jan-2023 (Sun)")
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string with day name
 */
export const formatDateWithDay = (date) => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return 'N/A';
  
  try {
    return format(parsedDate, 'dd-MMM-yyyy (EEE)');
  } catch (error) {
    console.error('Error formatting date with day:', error);
    return 'N/A';
  }
};

/**
 * Format a date for display in a user-friendly way
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "15 January 2023")
 */
export const formatDateLong = (date) => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return 'N/A';
  
  try {
    return format(parsedDate, 'dd MMMM yyyy');
  } catch (error) {
    console.error('Error formatting long date:', error);
    return 'N/A';
  }
};

/**
 * Format a date and time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string (e.g., "15/01/2023 14:30")
 */
export const formatDateTime = (date) => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return 'N/A';
  
  try {
    return format(parsedDate, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'N/A';
  }
};

/**
 * Format a time duration between two dates
 * @param {string|Date} startDate - The start date
 * @param {string|Date} endDate - The end date
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export const formatDuration = (startDate, endDate) => {
  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);
  
  if (!start || !end) return 'N/A';
  
  try {
    const diffInMinutes = Math.round((end - start) / (1000 * 60));
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } catch (error) {
    console.error('Error formatting duration:', error);
    return 'N/A';
  }
};

/**
 * Check if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return false;
  
  const today = new Date();
  return (
    parsedDate.getDate() === today.getDate() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Get the start of the day for a given date
 * @param {string|Date} date - The date
 * @returns {Date} Start of the day
 */
export const startOfDay = (date) => {
  const parsedDate = safeParseDate(date) || new Date();
  return new Date(parsedDate.setHours(0, 0, 0, 0));
};

/**
 * Get the end of the day for a given date
 * @param {string|Date} date - The date
 * @returns {Date} End of the day
 */
export const endOfDay = (date) => {
  const parsedDate = safeParseDate(date) || new Date();
  return new Date(parsedDate.setHours(23, 59, 59, 999));
};

export default {
  safeParseDate,
  formatDate,
  formatDateWithDay,
  formatDateLong,
  formatDateTime,
  formatDuration,
  isToday,
  startOfDay,
  endOfDay
};
