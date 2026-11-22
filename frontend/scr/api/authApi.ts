import { apiClient } from "./client";
import { ENDPOINTS } from "./config";

export interface VerifyAdminResponse {
  admin_token: string;
  token_type: string;
}

export const authApi = {
  verifyAdmin: async (password: string): Promise<VerifyAdminResponse> => {
    return apiClient.post(ENDPOINTS.verifyAdmin(), { password });
  },
};

