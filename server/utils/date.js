const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const parseCutOffTime = (cutOffTime) => {
  const [hours, minutes] = cutOffTime.split(":").map(Number);
  return { hours, minutes };
};

const getCutOffDateTime = (deliveryDate, cutOffTime) => {
  const { hours, minutes } = parseCutOffTime(cutOffTime);
  const date = new Date(deliveryDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const hasCutOffPassed = (deliveryDate, cutOffTime) => {
  const cutOffDate = getCutOffDateTime(deliveryDate, cutOffTime);
  return new Date() > cutOffDate;
};

// Returns the *nearest* calendar date matching this weekday, which may be
// today. This is the actual batch date a customer means when they pick a
// day: "today" if today is that weekday and its cutoff hasn't passed yet,
// otherwise the next upcoming occurrence.
const getNearestDateForWeekday = (weekday, fromDate = new Date()) => {
  const dayIndex = WEEK_DAYS.indexOf(weekday);
  if (dayIndex === -1) return null;

  const result = new Date(fromDate);
  const currentDay = result.getDay();
  const delta = (dayIndex + 7 - currentDay) % 7;
  result.setDate(result.getDate() + delta);
  result.setHours(0, 0, 0, 0);

  return result;
};

export {
  WEEK_DAYS,
  getNearestDateForWeekday,
  getCutOffDateTime,
  hasCutOffPassed,
};
