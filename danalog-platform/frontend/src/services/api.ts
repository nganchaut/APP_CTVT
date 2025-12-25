
const API_URL = 'https://app-ctvt.onrender.com/api';


const mapBackendToFrontend = (data: any): any => {
    return {
        ...data,
        // Map mismatched fields
        dateStart: data.startDate || data.dateStart,
        dateEnd: data.endDate || data.dateEnd,
        licensePlate: data.licensePlate || data.vehicleId,
        customerCode: data.customerCode || (data.customerId ? data.customerId.replace('cust_', '').toUpperCase() : data.customerName),
        size: data.containerSize || data.size,
        fe: data.containerType || data.fe,
        trips: data.tripCount || data.trips,
        nightStay: data.overnightStay !== undefined ? data.overnightStay : data.nightStay,
        nightStayDays: data.overnightNights || data.nightStayDays,

        // Ensure numeric defaults to avoid NaN
        revenue: data.revenue || 0,
        driverSalary: data.driverSalary || 0
    };
};

export const api = {
    getTickets: async () => {
        try {
            const res = await fetch(`${API_URL}/tickets`);
            if (!res.ok) throw new Error('Failed to fetch tickets');
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapBackendToFrontend) : [];
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
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapBackendToFrontend) : mapBackendToFrontend(data);
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
            const data = await res.json();
            return mapBackendToFrontend(data);
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
            const data = await res.json();
            return mapBackendToFrontend(data);
        } catch (error) {
            console.error('API updateTicket error:', error);
            throw error;
        }
    }
};
