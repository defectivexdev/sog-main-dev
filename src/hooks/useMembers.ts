import useSWR from "swr";
import { Member } from "@/types";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useMembers() {
  const { data, error, isLoading, mutate } = useSWR("/api/members", fetcher);

  const rawMembers = data?.data || data || [];
  const members = Array.isArray(rawMembers) ? rawMembers as Member[] : [];

  // Filter members by status if needed
  const activeMembers = members.filter(m => m.status === "active");

  return {
    members,
    activeMembers,
    isLoading,
    error,
    refreshMembers: mutate
  };
}
