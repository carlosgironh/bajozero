const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqiqeyopvjsnutyihczh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaXFleW9wdmpzbnV0eWloY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjY0MDUsImV4cCI6MjA5OTEwMjQwNX0.v0a0G_hsRmaAKCTPBH5WHDtRF2gsTCBBJET2zXFLBTM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
    console.log("Creating admin...");
    const admin = await supabase.auth.signUp({
        email: 'admin@bajozero.net',
        password: 'admin123',
        options: {
            data: {
                full_name: 'Administrador Principal',
                role: 'administrador'
            }
        }
    });
    console.log("Admin result:", admin.data, admin.error);

    console.log("Creating secre...");
    const secre = await supabase.auth.signUp({
        email: 'secretaria@bajozero.net',
        password: 'secre123',
        options: {
            data: {
                full_name: 'Secretaria General',
                role: 'secretaria'
            }
        }
    });
    console.log("Secre result:", secre.data, secre.error);

    console.log("Creating tecnico...");
    const tech = await supabase.auth.signUp({
        email: 'tecnico@bajozero.net',
        password: 'tecnico123',
        options: {
            data: {
                full_name: 'Técnico Especialista',
                role: 'tecnico'
            }
        }
    });
    console.log("Tecnico result:", tech.data, tech.error);
}

createUsers();
