const { BufferJSON, initAuthCreds, proto } = require('@whiskeysockets/baileys');

/**
 * Custom Baileys Auth State that persists to Supabase Database
 */
const useSupabaseAuthState = async (supabase, clientId) => {
    const writeData = async (data, category) => {
        const { data: existing } = await supabase
            .from('wa_sessions')
            .select('data')
            .eq('id', clientId)
            .single();

        const sessionData = existing?.data || {};
        if (!sessionData[category]) sessionData[category] = {};

        // Merge and serialize
        for (const key in data) {
            if (data[key]) {
                sessionData[category][key] = JSON.parse(JSON.stringify(data[key], BufferJSON.replacer));
            } else {
                delete sessionData[category][key];
            }
        }

        await supabase
            .from('wa_sessions')
            .upsert({ 
                id: clientId, 
                data: sessionData,
                updated_at: new Date()
            });
    };

    const readData = async (category) => {
        const { data, error } = await supabase
            .from('wa_sessions')
            .select('data')
            .eq('id', clientId)
            .single();

        if (error || !data?.data?.[category]) return {};
        
        const categoryData = data.data[category];
        const result = {};
        for (const key in categoryData) {
            result[key] = JSON.parse(JSON.stringify(categoryData[key]), BufferJSON.reviver);
        }
        return result;
    };

    // Load initial creds
    const { data: session } = await supabase
        .from('wa_sessions')
        .select('data')
        .eq('id', clientId)
        .single();

    let creds = session?.data?.creds;
    if (creds) {
        creds = JSON.parse(JSON.stringify(creds), BufferJSON.reviver);
    } else {
        creds = initAuthCreds();
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const keysData = await readData('keys') || {};
                    const result = {};
                    for (const id of ids) {
                        let value = keysData[`${type}-${id}`];
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        result[id] = value;
                    }
                    return result;
                },
                set: async (data) => {
                    const keysToUpdate = {};
                    for (const category in data) {
                        for (const id in data[category]) {
                            keysToUpdate[`${category}-${id}`] = data[category][id];
                        }
                    }
                    await writeData(keysToUpdate, 'keys');
                }
            }
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        }
    };
};

module.exports = useSupabaseAuthState;
