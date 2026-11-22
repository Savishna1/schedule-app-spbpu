import { apiClient } from "./client";
import { ENDPOINTS } from "./config";

export interface ChildGroup {
  program_id: number;
  group_number: string;
}

export interface Child {
  name: string;
  groups: ChildGroup[];
}

export interface ChildrenData {
  children: Child[];
}

export const childrenApi = {
  saveChildren: async (data: ChildrenData) => {
    return apiClient.post(ENDPOINTS.saveChildren(), data);
  },
};

