package com.example.bajozerotecnicos
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import com.example.bajozerotecnicos.models.Inspection
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.bajozerotecnicos.theme.BajoZeroTecnicosTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    enableEdgeToEdge()
    setContent {
      BajoZeroTecnicosTheme { Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { MainNavigation() } }
    }
  }
}

@Composable
fun MainNavigation() {
    val navController = rememberNavController()
    var currentInspection by remember { mutableStateOf<Inspection?>(null) }
    
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            com.example.bajozerotecnicos.ui.LoginScreen(
                onLoginSuccess = { role -> 
                    if (role == "superadmin" || role == "coordinador") {
                        navController.navigate("adminDashboard") { popUpTo("login") { inclusive = true } }
                    } else {
                        navController.navigate("dashboard") { popUpTo("login") { inclusive = true } }
                    }
                }
            )
        }
        composable("adminDashboard") {
            com.example.bajozerotecnicos.ui.AdminDashboardScreen(
                onLogout = { navController.navigate("login") { popUpTo("adminDashboard") { inclusive = true } } }
            )
        }
        composable("dashboard") {
            com.example.bajozerotecnicos.ui.DashboardScreen(
                onInspectionSelected = { inspection -> 
                    currentInspection = inspection
                    navController.navigate("form") 
                },
                onLogout = { navController.navigate("login") { popUpTo("dashboard") { inclusive = true } } }
            )
        }
        composable("form") {
            currentInspection?.let { inspection ->
                com.example.bajozerotecnicos.ui.InspectionFormScreen(
                    inspection = inspection,
                    onBack = { navController.popBackStack() },
                    onSubmitSuccess = { 
                        navController.popBackStack() 
                    }
                )
            }
        }
    }
}
