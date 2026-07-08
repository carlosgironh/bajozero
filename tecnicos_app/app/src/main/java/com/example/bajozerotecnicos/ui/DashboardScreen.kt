package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.bajozerotecnicos.models.Inspection
import com.example.bajozerotecnicos.supabase
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onInspectionSelected: (Inspection) -> Unit,
    onLogout: () -> Unit
) {
    var inspections by remember { mutableStateOf<List<Inspection>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedTab by remember { mutableStateOf(0) } // 0 = Asignadas, 1 = Completadas
    val scope = rememberCoroutineScope()

    LaunchedEffect(selectedTab) {
        isLoading = true
        try {
            val user = supabase.auth.currentUserOrNull()
            if (user != null) {
                val statusFilter = if (selectedTab == 0) "asignada" else "completada"
                // Supabase Kotlin select with relations
                inspections = supabase.postgrest["inspections"]
                    .select(columns = io.github.jan.supabase.postgrest.query.Columns.raw("*, clients(*)")) {
                        filter {
                            eq("inspector_id", user.id)
                            eq("status", statusFilter)
                        }
                    }
                    .decodeList<Inspection>()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Panel del Técnico") },
                actions = {
                    IconButton(onClick = {
                        scope.launch {
                            supabase.auth.signOut()
                            onLogout()
                        }
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Cerrar sesión")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Asignadas") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Completadas") }
                )
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (inspections.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No hay inspecciones en esta sección.")
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(inspections) { inspection ->
                        InspectionCard(
                            inspection = inspection,
                            onClick = { if (selectedTab == 0) onInspectionSelected(inspection) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun InspectionCard(inspection: Inspection, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Inspección: ${inspection.inspectionNumber}",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            // Show client name if available
            Text(text = "Cliente: ${inspection.client?.contactName ?: "Sin nombre"}", style = MaterialTheme.typography.bodyLarge)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = "Fecha programada: ${inspection.scheduledDate ?: "N/A"}", style = MaterialTheme.typography.bodyMedium)
        }
    }
}
