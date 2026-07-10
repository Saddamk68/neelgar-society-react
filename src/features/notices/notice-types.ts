export type Announcement = {
  id: number;
  title: string;
  message: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  societyId: number;
};

export type Notice = {
  type: "ANNOUNCEMENT" | "EVENT";
  title: string;
  message?: string;
  date: string;
};
