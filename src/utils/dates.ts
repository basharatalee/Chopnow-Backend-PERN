// src/utils/dates.ts
export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const diffToMonday = (day + 6) % 7; // Monday as start
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfWeek = () => {
  const s = startOfWeek();
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};
