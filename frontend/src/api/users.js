// src/api/users.js
import axiosInstance from './axiosInstance.js';

export const getUserApi = async (id) => {
  const { data } = await axiosInstance.get(`/users/${id}`);
  return data.data;
};

export const getUserPostsApi = async (id, { cursor, limit = 20 } = {}) => {     //<------ adapter
  const params = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await axiosInstance.get(`/users/${id}/posts`, { params });
  return data.data;
};

export const updateMeApi = async (updates) => {
  const { data } = await axiosInstance.patch('/users/me', updates);
  return data.data;
};

export const getAuraLogApi = async (id, { cursor, limit = 20 } = {}) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await axiosInstance.get(`/users/${id}/aura-log`, { params });
  return data.data;
};
