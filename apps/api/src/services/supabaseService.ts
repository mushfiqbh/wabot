const { createClient } = require('@supabase/supabase-js');
require('../utils/config');

class SupabaseService {
    [key: string]: any;
    constructor() {
        this.client = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    async getClientByKey(apiKey) {
        const { data, error } = await this.client
            .from('clients')
            .select('id, name, user_id')
            .eq('api_key', apiKey)
            .single();
        if (error || !data) return null;
        return data;
    }

    async registerClient(name, userId = null, phone = null) {
        console.log(`Registering client: ${name}, userId: ${userId}, phone: ${phone}`);
        const payload: Record<string, any> = { name, phone };
        if (userId) payload.user_id = userId;

        try {
            // Try to update existing by user_id if present
            if (userId) {
                const { data: existing, error: fetchError } = await this.client
                    .from('clients')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (fetchError) {
                    console.error(`Fetch existing client error: ${fetchError.message} (${fetchError.code})`);
                    // Don't throw — let it fall through to insert which will surface the real issue
                }

                if (existing) {
                    console.log(`Updating existing client ID: ${existing.id}`);
                    const { data, error } = await this.client
                        .from('clients')
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
                .from('clients')
                .insert([payload])
                .select()
                .single();
            
            if (error) {
                console.error(`Insert error: ${error.message} (code: ${error.code}, details: ${error.details || 'none'})`);
                // Check if it's a race condition where it was just created
                if (error.code === '23505' && userId) {
                    const { data: retry } = await this.client
                        .from('clients')
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
            .from('clients')
            .select('*')
            .eq('name', name)
            .single();
        if (error || !data) throw new Error('Client not found');
        return data;
    }

    async getClientByUserId(userId) {
        const { data, error } = await this.client
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) return null;
        return data;
    }

    async rotateApiKey(userId) {
        const newKey = require('crypto').randomBytes(24).toString('base64');
        const { data, error } = await this.client
            .from('clients')
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
            .from('sessions')
            .select('id');

        if (error) throw error;
        return (data || []).map(row => row.id);
    }

    async getClientIds() {
        const { data, error } = await this.client
            .from('clients')
            .select('id');

        if (error) throw error;
        return (data || []).map(row => row.id);
    }

    async enqueueMessages(clientId, messages) {
        const { data, error } = await this.client
            .from('messages')
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
            .from('messages')
            .select('*, clients(id)')
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
                    .from('messages')
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
        const payload: Record<string, any> = { 
            status, 
            updated_at: new Date() 
        };
        if (status === 'sent') payload.sent_at = new Date();
        if (errorMsg) payload.error = errorMsg;
        if (retryCount !== null) payload.retry_count = retryCount;

        await this.client
            .from('messages')
            .update(payload)
            .eq('id', id);
    }
    async logMessageFailure({ clientId, messageId = null, number = null, error, errorCode = null, retryCount = null, stage = null }) {
        try {
            const payload: Record<string, any> = {
                client_id: clientId,
                error_message: typeof error === 'string' ? error : (error?.message || String(error)),
            };
            if (messageId) payload.message_id = messageId;
            if (number) payload.number = number;
            if (errorCode) payload.error_code = String(errorCode);
            if (retryCount !== null && retryCount !== undefined) payload.retry_count = retryCount;
            if (stage) payload.stage = stage;

            const { error: insertError } = await this.client
                .from('message_failures')
                .insert([payload]);

            if (insertError) {
                console.error(`Failed to log message failure: ${insertError.message}`);
            }
        } catch (err) {
            console.error(`logMessageFailure threw: ${err.message}`);
        }
    }

    async getRecentMessageFailures(clientId, limit = 50) {
        const { data, error } = await this.client
            .from('message_failures')
            .select('id, client_id, message_id, number, error_message, error_code, retry_count, stage, created_at')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error(`Failed to fetch message failures: ${error.message}`);
            return [];
        }
        return data || [];
    }

}
module.exports = new SupabaseService();

