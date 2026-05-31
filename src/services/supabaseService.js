const { createClient } = require('@supabase/supabase-js');
require('../utils/config');

class SupabaseService {
    constructor() {
        this.client = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    async getClientByKey(apiKey) {
        const { data, error } = await this.client
            .from('wa_clients')
            .select('id, name, user_id')
            .eq('api_key', apiKey)
            .single();
        if (error || !data) return null;
        return data;
    }

    async registerClient(name, userId = null, phone = null) {
        console.log(`Registering client: ${name}, userId: ${userId}, phone: ${phone}`);
        const payload = { name, phone };
        if (userId) payload.user_id = userId;

        try {
            // Try to update existing by user_id if present
            if (userId) {
                const { data: existing, error: fetchError } = await this.client
                    .from('wa_clients')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (existing) {
                    console.log(`Updating existing client ID: ${existing.id}`);
                    const { data, error } = await this.client
                        .from('wa_clients')
                        .update({ ...payload, updated_at: new Date() })
                        .eq('user_id', userId)
                        .select()
                        .single();
                    if (error) throw error;
                    return data;
                }
            }

            // Otherwise insert new
            console.log('Inserting new client record');
            const { data, error } = await this.client
                .from('wa_clients')
                .insert([payload])
                .select()
                .single();
            
            if (error) {
                console.error(`Insert error: ${error.message} (${error.code})`);
                // Check if it's a race condition where it was just created
                if (error.code === '23505' && userId) {
                    const { data: retry } = await this.client
                        .from('wa_clients')
                        .select('*')
                        .eq('user_id', userId)
                        .single();
                    if (retry) return retry;
                }
                throw error;
            }
            return data;
        } catch (err) {
            console.error('Registration failed:', err);
            throw err;
        }
    }

    async loginClient(name) {
        const { data, error } = await this.client
            .from('wa_clients')
            .select('*')
            .eq('name', name)
            .single();
        if (error || !data) throw new Error('Client not found');
        return data;
    }

    async getClientByUserId(userId) {
        const { data, error } = await this.client
            .from('wa_clients')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) return null;
        return data;
    }

    async rotateApiKey(userId) {
        const newKey = require('crypto').randomBytes(24).toString('base64');
        const { data, error } = await this.client
            .from('wa_clients')
            .update({ 
                api_key: newKey, 
                updated_at: new Date() 
            })
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async getClientSessionIds() {
        const { data, error } = await this.client
            .from('wa_sessions')
            .select('id');

        if (error) throw error;
        return (data || []).map(row => row.id);
    }

    async getClientIds() {
        const { data, error } = await this.client
            .from('wa_clients')
            .select('id');

        if (error) throw error;
        return (data || []).map(row => row.id);
    }

    async enqueueMessages(clientId, messages) {
        const { data, error } = await this.client
            .from('wa_messages')
            .insert(messages.map(m => ({
                client_id: clientId,
                number: m.number,
                message: m.message,
                status: 'pending'
            })))
            .select();
        if (error) throw error;
        return data;
    }

    async getNextPendingMessage() {
        // Find messages where the client has an active subscription
        const now = new Date().toISOString();
        
        // This is a bit complex for a single query in Supabase without a RPC or View
        // We'll fetch pending messages and then check if the client has a sub
        const { data, error } = await this.client
            .from('wa_messages')
            .select('*, wa_clients(id)')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(20); // Get a batch to check

        if (error || !data || data.length === 0) return null;

        for (const msg of data) {
            const { data: sub } = await this.client
                .from('subscriptions')
                .select('id')
                .eq('client_id', msg.client_id)
                .eq('status', 'active')
                .gt('end_date', now)
                .limit(1)
                .maybeSingle();

            if (sub) {
                // Mark as processing immediately
                const { data: updated, error: updateError } = await this.client
                    .from('wa_messages')
                    .update({ status: 'processing', updated_at: new Date() })
                    .eq('id', msg.id)
                    .select()
                    .single();

                if (!updateError) return updated;
            } else {
                // Optional: mark message as failed if no active sub
                await this.updateMessageStatus(msg.id, 'failed', 'No active subscription');
            }
        }

        return null;
    }

    async updateMessageStatus(id, status, errorMsg = null, retryCount = null) {
        const payload = { 
            status, 
            updated_at: new Date() 
        };
        if (status === 'sent') payload.sent_at = new Date();
        if (errorMsg) payload.error = errorMsg;
        if (retryCount !== null) payload.retry_count = retryCount;

        await this.client
            .from('wa_messages')
            .update(payload)
            .eq('id', id);
    }
}
module.exports = new SupabaseService();
