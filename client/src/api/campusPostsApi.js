import axiosInstance from './axiosInstance';
import { INITIAL_CAMPUS_POSTS } from '../data/studentDashboardData';

/**
 * Campus Social Posts Service & Endpoints
 */
export const campusPostsApi = {
  // Get all campus posts
  getPosts: async () => {
    try {
      const res = await axiosInstance.get('/campus-posts');
      return res.data;
    } catch {
      return INITIAL_CAMPUS_POSTS;
    }
  },

  // Toggle like on post
  toggleLike: async (postId, isLiked) => {
    try {
      const res = await axiosInstance.post(`/campus-posts/${postId}/like`, { liked: isLiked });
      return res.data;
    } catch {
      return { success: true, postId, liked: isLiked };
    }
  },
};

export default campusPostsApi;
