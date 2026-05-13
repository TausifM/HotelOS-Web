// lib/hooks/use-reports.ts
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";

export function useDashboardReport(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["reports", "dashboard", params],
    queryFn: async () => (await reportsApi.dashboard(params)).data.data,
  });
}

export function useDailyBusiness(date?: string) {
  return useQuery({
    queryKey: ["reports", "daily-business", date],
    queryFn: async () => (await reportsApi.dailyBusiness(date)).data.data,
  });
}

export function useOccupancy(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "occupancy", startDate, endDate],
    queryFn: async () => (await reportsApi.occupancy(startDate, endDate)).data.data,
    enabled: !!startDate && !!endDate,
  });
}

export function useRevenue(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["reports", "revenue", startDate, endDate],
    queryFn: async () => (await reportsApi.revenue(startDate, endDate)).data.data,
  });
}

export function useGuests() {
  return useQuery({
    queryKey: ["reports", "guests"],
    queryFn: async () => (await reportsApi.guests()).data.data,
  });
}