import { clerkClient } from "@clerk/nextjs/server";
import { filterUserForClient } from "~/server/api/helpers/filterUserForClient";
import { TRPCError } from "@trpc/server";

import type { Post, Comment, PostLike, CommentLike } from "@prisma/client";

const fetchUserData = async (userId: string[] | undefined, limit: number) => {
  return (
    await clerkClient.users.getUserList({
      userId,
      limit,
    })
  ).map(filterUserForClient);
};

export const bindUserDataToComments = async (
  comments: (Comment & { likes: CommentLike[] })[]
) => {
  const userIdArr = comments.map((comment) => comment.authorId);
  const users = await fetchUserData(userIdArr, 100);

  const userWithComments = comments.map((comment) => {
    const userWithComment = users.find((user) => {
      return user.authorId === comment.authorId;
    });

    if (!userWithComment) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `User not found. POST ID: ${comment.id}, USER ID: ${comment.authorId}`,
      });
    }
    return {
      ...comment,
      ...userWithComment,
    };
  });
  return userWithComments;
};

export const bindUserDataToPosts = async (
  posts: (Post & {
    likes: PostLike[];
  })[]
) => {
  const userIdArr = posts.map((post) => post.authorId);
  const users = await fetchUserData(userIdArr, 100);

  const userWithPosts = posts.map((post) => {
    const userWithPost = users.find((user) => {
      return user.authorId === post.authorId;
    });

    if (!userWithPost) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `User not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
      });
    }
    return {
      ...post,
      ...userWithPost,
    };
  });
  return userWithPosts;
};
