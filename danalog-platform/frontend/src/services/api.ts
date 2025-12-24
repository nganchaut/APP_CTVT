
const API_URL = 'http://localhost:3001/api';

export const api = {
    getTickets: async () => {
        try {
            const res = await fetch(`${API_URL}/tickets`);
            if (!res.ok) throw new Error('Failed to fetch tickets');
            return await res.json();
        } catch (error) {
            console.error('API getTickets error:', error);
            return [];
        }
    },

    saveTickets: async (tickets: any[]) => {
        try {
            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tickets)
            });
            if (!res.ok) throw new Error('Failed to save tickets');
            return await res.json();
        } catch (error) {
            console.error('API saveTickets error:', error);
            throw error;
        }
    },

    createTicket: async (ticket: any) => {
        try {
            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticket)
            });
            if (!res.ok) throw new Error('Failed to create ticket');
            return await res.json();
        } catch (error) {
            console.error('API createTicket error:', error);
            throw error;
        }
    },

    updateTicket: async (id: string, updates: any) => {
        try {
            const res = await fetch(`${API_URL}/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update ticket');
            return await res.json();
        } catch (error) {
            console.error('API updateTicket error:', error);
            throw error;
        }
    }
};
