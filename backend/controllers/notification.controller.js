import Notification from "../models/notification.model.js";

export async function getAllNotifications(req, res) {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImage",
    });

    if (notifications.length === 0) return res.status(200).json([]);

    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json(notifications);
  } catch (error) {
    console.log(`Error from getAllNotifications function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function deleteAllNotifications(req, res) {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications deleted successfully" });
  } catch (error) {
    console.log(`Error from deleteNotification function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}
export async function deleteNotification(req, res) {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);
    if (!notification)
      return res.status(404).json({ error: "Nofication not found" });

    if (notification.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not allowed to delete this notification" });
    }

    await Notification.findByIdAndDelete(notification._id);

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log(`Error from deleteNotification function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}
