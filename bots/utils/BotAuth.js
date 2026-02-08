import axios from 'axios';

class BotAuth {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
        this.user = null;
    }

    async login(email, password) {
        try {
            const response = await axios.post(`${this.baseUrl}/auth/login`, {
                email,
                password,
            });

            this.token = response.data.token;
            this.user = response.data;
            console.log(`[BotAuth] Logged in as: ${this.user.username}`);
            return this.token;
        } catch (error) {
            console.error(
                '[BotAuth] Login failed:',
                error.response?.data?.message || error.message
            );
            throw error;
        }
    }

    getToken() {
        return this.token;
    }

    getHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
        };
    }
}

export default BotAuth;
