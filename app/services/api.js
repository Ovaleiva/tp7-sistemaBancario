const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiService {
  async createTransaction(transactionData) {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();