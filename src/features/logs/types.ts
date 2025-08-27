export type LogLevel = "INFO" | "WARN" | "ERROR";

export type LogEntry = {
  id: string;
  timestamp: string; // ISO string
  level: LogLevel;
  actor: string;     // who did it
  action: string;    // what happened
  details?: string;  // optional extra info
};
