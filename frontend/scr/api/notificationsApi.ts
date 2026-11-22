import { apiClient } from "./client";
import { ENDPOINTS } from "./config";

export interface GroupSubscription {
  program_name: string;
  study_year: number;
  group_number: string;
}

export interface SubscribeDeviceData {
  fcm_token: string; 
  groups: GroupSubscription[];
}

export const notificationsApi = {
  subscribeDevice: async (data: SubscribeDeviceData) => {
    const url = ENDPOINTS.subscribeDevice();
    return apiClient.post(url, data);
  },
};
