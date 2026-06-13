// src/utils/notifications.ts

export const initializeNotificationEngine = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser environment does not support desktop alerts.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const triggerTaskAlert = (taskTitle: string, urgencyLevel: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  new Notification("Workspace Task Synchronization", {
    body: `CRITICAL TIMER: "${taskTitle}" requires tracking attention soon.`,
    icon: "https://cdn-icons-png.flaticon.com/512/3208/3208743.png", // Web-safe high-contrast workspace logo
    tag: "task-urgency-reminder",            // Keeps alerts stacked neatly instead of spamming
    requireInteraction: urgencyLevel === "URGENT" || urgencyLevel === "HIGH"
  });
};
