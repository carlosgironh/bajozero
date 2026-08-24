package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.bajozerotecnicos.models.Inspection
import com.example.bajozerotecnicos.theme.BajoZeroTecnicosTheme

sealed class Screen {
    object Login : Screen()
    object Dashboard : Screen()
    object AdminDashboard : Screen()
    data class Form(val inspection: Inspection) : Screen()
}

@Composable
fun App() {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }

    BajoZeroTecnicosTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            when (val screen = currentScreen) {
                is Screen.Login -> {
                    LoginScreen(
                        onLoginSuccess = { role ->
                            if (role == "superadmin" || role == "coordinador") {
                                currentScreen = Screen.AdminDashboard
                            } else {
                                currentScreen = Screen.Dashboard
                            }
                        }
                    )
                }
                is Screen.Dashboard -> {
                    DashboardScreen(
                        onInspectionSelected = { inspection ->
                            currentScreen = Screen.Form(inspection)
                        },
                        onLogout = {
                            currentScreen = Screen.Login
                        }
                    )
                }
                is Screen.AdminDashboard -> {
                    AdminDashboardScreen(
                        onLogout = {
                            currentScreen = Screen.Login
                        }
                    )
                }
                is Screen.Form -> {
                    InspectionFormScreen(
                        inspection = screen.inspection,
                        onBack = {
                            currentScreen = Screen.Dashboard
                        },
                        onSubmitSuccess = {
                            currentScreen = Screen.Dashboard
                        }
                    )
                }
            }
        }
    }
}
