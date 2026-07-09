package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.bajozerotecnicos.supabase
import io.github.jan.supabase.gotrue.auth
import kotlinx.coroutines.launch

sealed class BottomNavItem(val title: String, val icon: ImageVector) {
    object Dashboard : BottomNavItem("Dashboard", Icons.Default.Home)
    object Tareas : BottomNavItem("Tareas", Icons.AutoMirrored.Filled.List)
    object Personal : BottomNavItem("Personal", Icons.Default.Person)
    object Clientes : BottomNavItem("Clientes", Icons.Default.Face)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(onLogout: () -> Unit) {
    var selectedItem by remember { mutableStateOf<BottomNavItem>(BottomNavItem.Dashboard) }
    val scope = rememberCoroutineScope()
    
    val items = listOf(
        BottomNavItem.Dashboard,
        BottomNavItem.Tareas,
        BottomNavItem.Personal,
        BottomNavItem.Clientes
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(selectedItem.title, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                ),
                actions = {
                    IconButton(onClick = {
                        scope.launch {
                            try {
                                supabase.auth.signOut()
                            } finally {
                                onLogout()
                            }
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Cerrar Sesión")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            ) {
                items.forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.title) },
                        label = { Text(item.title) },
                        selected = selectedItem == item,
                        onClick = { selectedItem = item },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues).fillMaxSize()) {
            when (selectedItem) {
                BottomNavItem.Dashboard -> AdminDashboardContent()
                BottomNavItem.Tareas -> Text("Lista de Tareas (Próximamente)", modifier = Modifier.align(Alignment.Center))
                BottomNavItem.Personal -> Text("Gestión de Personal (Próximamente)", modifier = Modifier.align(Alignment.Center))
                BottomNavItem.Clientes -> Text("Gestión de Clientes (Próximamente)", modifier = Modifier.align(Alignment.Center))
            }
        }
    }
}

@Composable
fun AdminDashboardContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top
    ) {
        Text("Bienvenido al Panel de Administración", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(24.dp))
        // TODO: Tarjetas de estadísticas
    }
}
