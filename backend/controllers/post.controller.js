import { v2 as cloudinary } from "cloudinary";

import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export async function createPost(req, res) {
  try {
    const { text } = req.body;
    let { image } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!text && !image) {
      return res.status(404).json({ error: "Post must have a text or image" });
    }

    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      image = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: user._id,
      text,
      image,
    });

    await newPost.save();

    return res.status(201).json(newPost);
  } catch (error) {
    console.log(`Error from createPost function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function deletePost(req, res) {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user._id.toString() !== req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You are not authorized to delete this post" });
    }

    if (post.img) {
      await cloudinary.uploader.destroy(
        post.img.split("/").pop().spilt(".")[0]
      );
    }

    await Post.findByIdAndDelete(post._id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(`Error from deletePost function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function commentOnPost(req, res) {
  try {
    const { text } = req.body;
    const { id } = req.params;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: "Text field are required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(400).json({ error: "Post not found" });
    }

    const newComment = {
      user: userId,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    const refetchedPost = await Post.findById(id)
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(refetchedPost);
  } catch (error) {
    console.log(`Error from deletePost function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function likeUnlikePost(req, res) {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const isAlreadyLiked = post.likes.includes(userId);
    if (isAlreadyLiked) {
      // unlike
      await Post.updateOne({ _id: post._id }, { $pull: { likes: userId } });
      await User.updateOne(
        { _id: userId },
        { $pull: { likedPosts: post._id } }
      );

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      return res.status(200).json(updatedLikes);
    } else {
      // like
      post.likes.push(userId);
      await User.updateOne(
        { _id: userId },
        { $push: { likedPosts: post._id } }
      );
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      const updatedLikes = post.likes;

      return res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log(`Error from likeUnlikePost function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getAllPosts(req, res) {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log(`Error from likeUnlikePost function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getLikedPosts(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (likedPosts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(likedPosts);
  } catch (error) {
    console.log(`Error from getLikedPosts function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getFollowingPosts(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const followingPosts = await Post.find({ user: { $in: user.followings } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (followingPosts.length === 0) return res.status(200).json([]);

    res.status(200).json(followingPosts);
  } catch (error) {
    console.log(`Error from getFollowingPosts function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getUserPosts(req, res) {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ user: user._id })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) return res.status(200).json([]);

    res.status(200).json(posts);
  } catch (error) {
    console.log(`Error from getUserPosts function, ${error}`);
    res.status(500).json({ error: "Something went wrong" });
  }
}
