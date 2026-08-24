package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.bajozerotecnicos.models.Inspection
import com.example.bajozerotecnicos.supabase
import com.example.bajozerotecnicos.theme.*
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onInspectionSelected: (Inspection) -> Unit,
    onLogout: () -> Unit
) {
    var inspections by remember { mutableStateOf<List<Inspection>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var selectedTab by remember { mutableStateOf(0) } // 0 = Asignadas, 1 = Completadas
    val scope = rememberCoroutineScope()

    LaunchedEffect(selectedTab) {
        isLoading = true
        errorMessage = null
        try {
            val user = supabase.auth.currentUserOrNull()
            if (user != null) {
                val statusFilter = if (selectedTab == 0) "asignada" else "completada"
                inspections = supabase.postgrest["tasks"]
                    .select(columns = Columns.raw("*, clients(*)")) {
                        filter {
                            eq("inspector_id", user.id)
                            eq("status", statusFilter)
                        }
                    }
                    .decodeList<Inspection>()
            }
        } catch (e: Exception) {
            errorMessage = e.message ?: "Error desconocido al cargar tareas"
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Mis Tareas", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Portal Técnico Bajo Zero", fontSize = 11.sp, color = Color(0xFFBAE6FD))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandPrimary,
                    titleContentColor = Color.White,
                    actionIconContentColor = Color.White
                ),
                actions = {
                    IconButton(onClick = {
                        scope.launch {
                            supabase.auth.signOut()
                            onLogout()
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Cerrar sesión")
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
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = SurfaceLight,
                contentColor = BrandPrimary
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { 
                        Text(
                            "Asignadas / Pendientes", 
                            fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium,
                            color = if (selectedTab == 0) BrandPrimary else TextMuted
                        ) 
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { 
                        Text(
                            "Completadas", 
                            fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                            color = if (selectedTab == 1) BrandPrimary else TextMuted
                        ) 
                    }
                )
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandPrimary)
                }
            } else if (errorMessage != null) {
                Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = StatusErrorBg),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "Error: $errorMessage", 
                            color = StatusError,
                            modifier = Modifier.padding(16.dp),
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            } else if (inspections.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Assignment,
                            contentDescription = null,
                            tint = TextPlaceholder,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (selectedTab == 0) "No tienes tareas asignadas pendientes." else "Aún no hay tareas completadas.",
                            color = TextMuted,
                            fontWeight = FontWeight.Medium
                        )
                    }
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
    val isCompleted = inspection.status == "completada"

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = AppCardShape,
        colors = CardDefaults.cardColors(containerColor = SurfaceLight),
        border = BorderStroke(1.dp, BorderSubtle),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Número de Tarea
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = BrandLight
                ) {
                    Text(
                        text = inspection.inspectionNumber ?: "BZ-TAREA",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = BrandPrimary,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                // Badge de Estado
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isCompleted) StatusSuccessBg else StatusWarningBg
                ) {
                    Text(
                        text = (inspection.status ?: "pendiente").uppercase(),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (isCompleted) StatusSuccess else StatusWarning
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(10.dp))
            
            Text(
                text = inspection.client?.contactName ?: "Cliente General", 
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextDark
            )
            
            val client = inspection.client
            if (client != null) {
                if (!client.phone.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Phone, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = client.phone, 
                            style = MaterialTheme.typography.bodySmall,
                            color = TextBody
                        )
                    }
                }
                
                if (!client.address.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(3.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = client.address, 
                            style = MaterialTheme.typography.bodySmall,
                            color = TextBody
                        )
                    }
                }
            }

            if (!inspection.scheduledDate.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CalendarToday, contentDescription = null, tint = BrandPrimary, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Programada: ${inspection.scheduledDate}", 
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        color = BrandPrimary
                    )
                }
            }
        }
    }
}
