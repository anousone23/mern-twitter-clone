import bcryptjs from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export async function getUserProfile(req, res) {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log(`Error from getUserProfile function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function followUnfollowUser(req, res) {
  try {
    const { id } = req.params;

    const userToFollow = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) {
      return res.status(400).json({ error: "User not found" });
    }

    if (id === currentUser._id.toString()) {
      return res
        .status(400)
        .json({ error: "Can not follow/unfollow yourself" });
    }

    const isFollowing = currentUser.followings.includes(id);

    if (isFollowing) {
      // unfollow user
      await User.findByIdAndUpdate(userToFollow._id, {
        $pull: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { followings: userToFollow._id },
      });
      res.status(200).json({ message: "User unfollowed succesfully" });
    } else {
      // follow user
      await User.findByIdAndUpdate(userToFollow._id, {
        $push: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { followings: userToFollow._id },
      });

      // send notification to user
      const newNotification = new Notification({
        type: "follow",
        from: currentUser._id,
        to: userToFollow._id,
      });

      await newNotification.save();

      res.status(200).json({ message: "User followed succesfully" });
    }
  } catch (error) {
    console.log(`Error from followUnfollowUser function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getSuggestedUsers(req, res) {
  try {
    const userId = req.user._id;

    const usersFollowedByMe = await User.findById(userId).select("followings");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.followings.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log(`Error from getSuggestedUsers function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function updateUser(req, res) {
  try {
    const {
      fullname,
      username,
      email,
      currentPassword,
      newPassword,
      link,
      bio,
    } = req.body;
    let { profileImage, coverImage } = req.body;

    const userId = req.user._id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      (currentPassword && !newPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        error: "Please provide both current password and new password",
      });
    }

    if (currentPassword && newPassword) {
      const isValidPassword = await bcryptjs.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      const salt = await bcryptjs.genSalt(10);
      user.password = await bcryptjs.hash(newPassword, salt);
    }

    if (profileImage) {
      if (user.profileImage) {
        await cloudinary.uploader.destroy(
          user.profileImage.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(profileImage);
      profileImage = uploadedResponse.secure_url;
    }

    if (coverImage) {
      if (user.coverImage) {
        await cloudinary.uploader.destroy(
          user.coverImage.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(coverImage);
      coverImage = uploadedResponse.secure_url;
    }

    user.fullname = fullname || user.fullname;
    user.username = username || user.username;
    user.email = email || user.email;
    user.link = link || user.link;
    user.bio = bio || user.bio;
    user.profileImage = profileImage || user.profileImage;
    user.coverImage = coverImage || user.coverImage;

    user = await user.save();

    user.password = null;

    res.status(200).json(user);
  } catch (error) {
    console.log(`Error from updateUser function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}
