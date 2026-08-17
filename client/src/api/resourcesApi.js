import axiosInstance from './axiosInstance';
import { INITIAL_LIBRARY_BOOKS } from '../data/studentDashboardData';

/**
 * Campus Resources Service & Endpoints
 */
export const resourcesApi = {
  // Library: Get Books catalog
  getLibraryBooks: async () => {
    try {
      const res = await axiosInstance.get('/resources/library/books');
      return res.data;
    } catch {
      return INITIAL_LIBRARY_BOOKS;
    }
  },

  // Library: Borrow book (Bimala Mam Approval)
  borrowBook: async (bookId, studentName = 'Suraj Poddar') => {
    try {
      const res = await axiosInstance.post(`/resources/library/books/${bookId}/borrow`, { studentName });
      return res.data;
    } catch {
      return { success: true, bookId, available: false, issuedTo: `Issued to ${studentName} (Due: Sep 01)` };
    }
  },

  // Library: Return book (Bimala Mam Verification)
  returnBook: async (bookId) => {
    try {
      const res = await axiosInstance.post(`/resources/library/books/${bookId}/return`);
      return res.data;
    } catch {
      return { success: true, bookId, available: true, issuedTo: null };
    }
  },

  // Sports: Request sports gear
  requestSportsGear: async (gearData) => {
    try {
      const res = await axiosInstance.post('/resources/sports/request', gearData);
      return res.data;
    } catch {
      return {
        id: `sp_${Date.now()}`,
        ...gearData,
        status: 'Approved & Ready for Pickup',
      };
    }
  },

  // Budget: Submit student/club fund claim
  submitBudgetClaim: async (claimData) => {
    try {
      const res = await axiosInstance.post('/resources/budget-claim', claimData);
      return res.data;
    } catch {
      return {
        id: `bc_${Date.now()}`,
        ...claimData,
        status: 'Approved by SSD',
      };
    }
  },

  // Facilities: Submit maintenance complaint ticket
  submitComplaintTicket: async (complaintData) => {
    try {
      const res = await axiosInstance.post('/resources/complaints', complaintData);
      return res.data;
    } catch {
      return {
        id: `cmp_${Date.now().toString().slice(-4)}`,
        ...complaintData,
        status: 'Assigned to Maintenance Staff',
        time: 'Just now',
      };
    }
  },
};

export default resourcesApi;
