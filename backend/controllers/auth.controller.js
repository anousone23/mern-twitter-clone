import bcryptjs from "bcryptjs";

import User from "../models/user.model.js";
import { generateTokenAndSetCookies } from "../lib/utils/generateToken.js";

export async function signup(req, res) {
  try {
    const { fullname, username, email, password } = req.body;

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateTokenAndSetCookies(newUser._id, res);
      await newUser.save();

      return res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        followings: newUser.followings,
        profileImage: newUser.profileImage,
        coverImage: newUser.coverImage,
      });
    } else {
      return res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log(`Error from signup function, ${error}`);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
export async function signin(req, res) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    const isValidPassword = await bcryptjs.compare(
      password,
      user?.password || ""
    );
    if (!user || !isValidPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    generateTokenAndSetCookies(user._id, res);

    return res.status(201).json({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      followers: user.followers,
      followings: user.followings,
      profileImage: user.profileImage,
      coverImage: user.coverImage,
    });
  } catch (error) {
    console.log(`Error from signin function, ${error}`);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
export async function logout(req, res) {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "Logout succesfully" });
  } catch (error) {
    console.log(`Error from logout function, ${error}`);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    console.log(`Error from getMe function, ${error}`);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
