import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, UserButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { CreateLoadingSpinner } from "../loading";
import { SignInPlate } from "~/components/SignInComponents/SignInComponents";
import cn from "classnames";

const postContentSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Post must contain at least 1 character(s)" })
    .max(255),
});
export const PostForm = () => {
  const [value, setValue] = useState("");
  const [height, setHeight] = useState("auto");
  const { user, isSignedIn } = useUser();
  useEffect(() => {
    const textArea = document.getElementById("myTextArea");
    // Counts inline height of textarea based on textarea's lineHeight & scrollHeight
    if (textArea) {
      textArea.style.height = `${parseInt(
        window.getComputedStyle(textArea).lineHeight
      )}px`;
      textArea.style.height = `${textArea.scrollHeight}px`;
    }
  }, [user, value]);

  const { register, handleSubmit } = useForm<z.infer<typeof postContentSchema>>(
    {
      resolver: zodResolver(postContentSchema),
    }
  );
  const { mutate: createPostReq, isLoading: isPosting } =
    api.posts.create.useMutation({
      onSuccess: () => {
        void ctx.posts.getAllInfinitePostsOrByUserId.invalidate();
        setValue("");
      },
      onError: (e) => {
        if (e.data?.code === "TOO_MANY_REQUESTS") {
          toast.error(e.message);
          return;
        }
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast.error(errorMessage[0]);
        }
      },
    });
  const ctx = api.useContext();
  const onValid = useCallback(
    (data: z.infer<typeof postContentSchema>) => {
      createPostReq(data);
    },
    [createPostReq]
  );
  if (!user || !user.username || !isSignedIn) {
    return (
      <div className="hidden flex-col border-b border-gray-600 px-4 py-3 sm:flex">
        <SignInPlate text="Sign in to create a post" />
      </div>
    );
  }
  return (
    <div className="flex flex-col border-b border-gray-600 py-3 px-4">
      <form
        onSubmit={handleSubmit(
          (data) => {
            console.log(data);
            onValid(data);
          },
          (e) => {
            e.content?.message && toast.error(e.content.message);
          }
        )}
      >
        <div className="flex h-fit justify-between gap-4">
          <UserButton
            appearance={{
              elements: { userButtonAvatarBox: { width: 48, height: 48 } },
            }}
          />

          <textarea
            className={cn(
              "grow resize-none overflow-y-hidden whitespace-pre-wrap bg-slate-200 py-4 outline-none dark:bg-zinc-900"
            )}
            {...register("content")}
            id="myTextArea"
            autoComplete="off"
            placeholder="What is happening?"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHeight(`${e.target.scrollHeight}px`);
            }}
            disabled={isPosting}
            style={{ height: height }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div
            className="flex gap-4
              "
          >
            <div className="w-12" />
            <span className="">🫠🫠🫠🫠🫠</span>
          </div>
          <div className="flex">
            {isPosting && (
              <span className="self-center pr-4">
                <CreateLoadingSpinner size={12} />
              </span>
            )}

            <button
              type="submit"
              className={cn(
                "rounded-full border border-blue-500 bg-blue-500 px-8 py-1 transition-colors hover:bg-blue-600 disabled:bg-blue-500 disabled:opacity-60"
              )}
              disabled={isPosting || !value}
            >
              Tweet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
