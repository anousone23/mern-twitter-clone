import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export function useFollow() {
  const queryClient = useQueryClient();

  const { mutate: follow, isPending: isFollowing } = useMutation({
    mutationFn: async (userId) => {
      try {
        const res = await fetch(`/api/users/follow/${userId}`, {
          method: "POST",
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        return data;
      } catch (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["suggestedUsers"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["authUser"],
        }),
      ]);
    },
  });

  return { follow, isFollowing };
}
