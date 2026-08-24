package com.example.bajozerotecnicos

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.serializer.KotlinXSerializer
import kotlinx.serialization.json.Json

val supabase = createSupabaseClient(
    supabaseUrl = "https://jqiqeyopvjsnutyihczh.supabase.co",
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaXFleW9wdmpzbnV0eWloY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjY0MDUsImV4cCI6MjA5OTEwMjQwNX0.v0a0G_hsRmaAKCTPBH5WHDtRF2gsTCBBJET2zXFLBTM"
) {
    install(Auth)
    install(Postgrest)
    defaultSerializer = KotlinXSerializer(Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    })
}
