const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqiqeyopvjsnutyihczh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaXFleW9wdmpzbnV0eWloY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjY0MDUsImV4cCI6MjA5OTEwMjQwNX0.v0a0G_hsRmaAKCTPBH5WHDtRF2gsTCBBJET2zXFLBTM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log("Testing login for admin...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@bajozero.net',
        password: 'admin123',
    });
    console.log("Admin login result:", error ? error.message : "Success!", data?.user?.id);
}

testLogin();
