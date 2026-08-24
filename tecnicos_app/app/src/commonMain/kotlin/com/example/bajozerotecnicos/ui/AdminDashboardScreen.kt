package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.bajozerotecnicos.supabase
import com.example.bajozerotecnicos.theme.*
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
                title = { 
                    Column {
                        Text(selectedItem.title, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Administración Bajo Zero", fontSize = 11.sp, color = Color(0xFFBAE6FD))
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
                containerColor = SurfaceLight,
                tonalElevation = 8.dp
            ) {
                items.forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.title) },
                        label = { Text(item.title, fontWeight = if (selectedItem == item) FontWeight.Bold else FontWeight.Normal) },
                        selected = selectedItem == item,
                        onClick = { selectedItem = item },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = BrandPrimary,
                            selectedTextColor = BrandPrimary,
                            indicatorColor = BrandLight,
                            unselectedIconColor = TextMuted,
                            unselectedTextColor = TextMuted
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues).fillMaxSize()) {
            when (selectedItem) {
                BottomNavItem.Dashboard -> AdminDashboardContent()
                BottomNavItem.Tareas -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Gestión de Tareas y Asignaciones", color = TextMuted, fontWeight = FontWeight.Medium)
                }
                BottomNavItem.Personal -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Gestión de Personal Técnico y Accesos", color = TextMuted, fontWeight = FontWeight.Medium)
                }
                BottomNavItem.Clientes -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Directorio Central de Clientes", color = TextMuted, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
fun AdminDashboardContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = BrandLight,
            modifier = Modifier.size(80.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.Dashboard,
                    contentDescription = null,
                    tint = BrandPrimary,
                    modifier = Modifier.size(44.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text("Panel Administrativo Bajo Zero", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = TextDark)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Control y supervisión centralizada en tiempo real", color = TextMuted, style = MaterialTheme.typography.bodyMedium)
    }
}
