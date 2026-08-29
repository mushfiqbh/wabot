const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

class BkashService {
    constructor() {
        this.bkashConfig = {
            base_url: process.env.BKASH_BASE_URL,
            username: process.env.BKASH_CHECKOUT_URL_USER_NAME,
            password: process.env.BKASH_CHECKOUT_URL_PASSWORD,
            app_key: process.env.BKASH_CHECKOUT_URL_APP_KEY,
            app_secret: process.env.BKASH_CHECKOUT_URL_APP_SECRET,
        };

        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    async createPayment(paymentDetails) {
        try {
            const { amount, callbackURL, orderID, reference } = paymentDetails;
            if (!amount) {
                return { statusCode: 2065, statusMessage: 'amount required' };
            }
            if (amount < 1) {
                return { statusCode: 2065, statusMessage: 'minimum amount 1' };
            }
            if (!callbackURL) {
                return { statusCode: 2065, statusMessage: 'callbackURL required' };
            }

            const response = await axios.post(
                `${this.bkashConfig.base_url}/tokenized/checkout/create`,
                {
                    mode: "0011",
                    currency: "BDT",
                    intent: "sale",
                    amount,
                    callbackURL,
                    payerReference: reference || "1",
                    merchantInvoiceNumber: orderID || "Inv_" + uuidv4().substring(0, 6)
                },
                {
                    headers: await this.authHeaders(),
                }
            );

            return response.data;
        } catch (e) {
            console.error("Create Bkash Payment Error:", e.response ? e.response.data : e.message);
            throw e;
        }
    }

    async executePayment(paymentID) {
        try {
            const response = await axios.post(
                `${this.bkashConfig.base_url}/tokenized/checkout/execute`,
                { paymentID },
                {
                    headers: await this.authHeaders(),
                }
            );

            return response.data;
        } catch (error) {
            console.error("Error from bkash executePayment:", error.response ? error.response.data : error.message);
            return null;
        }
    }

    async authHeaders() {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            authorization: await this.grantToken(),
            "x-app-key": this.bkashConfig.app_key,
        };
    }

    async grantToken() {
        try {
            const { data: findToken, error } = await this.supabase
                .from('bkash_tokens')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error("Error fetching bkash token from database:", error);
            }

            const oneHourAgo = new Date(Date.now() - 3600000);
            if (!findToken || new Date(findToken.updated_at) < oneHourAgo) {
                return await this.setToken();
            }

            return findToken.auth_token;
        } catch (e) {
            console.error("Error in grantToken:", e);
            return null;
        }
    }

    async setToken() {
        try {
            const response = await axios.post(
                `${this.bkashConfig.base_url}/tokenized/checkout/token/grant`,
                {
                    app_key: this.bkashConfig.app_key,
                    app_secret: this.bkashConfig.app_secret,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        username: this.bkashConfig.username,
                        password: this.bkashConfig.password,
                    },
                }
            );

            if (response.data && response.data.id_token) {
                const id_token = response.data.id_token;
                const { data: existingToken } = await this.supabase
                    .from('bkash_tokens')
                    .select('id')
                    .limit(1)
                    .maybeSingle();

                if (existingToken) {
                    await this.supabase
                        .from('bkash_tokens')
                        .update({ auth_token: id_token, updated_at: new Date() })
                        .eq('id', existingToken.id);
                } else {
                    await this.supabase
                        .from('bkash_tokens')
                        .insert([{ auth_token: id_token }]);
                }
                return id_token;
            }
            return null;
        } catch (error) {
            console.error("Error in setToken:", error.response ? error.response.data : error.message);
            return null;
        }
    }
}

module.exports = new BkashService();