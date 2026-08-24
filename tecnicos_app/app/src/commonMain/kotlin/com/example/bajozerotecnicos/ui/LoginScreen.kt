package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.bajozerotecnicos.models.Profile
import com.example.bajozerotecnicos.supabase
import com.example.bajozerotecnicos.theme.*
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight),
        contentAlignment = Alignment.Center
    ) {
        // Fondo decorativo con halos sutiles de la marca
        Box(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier
                    .size(320.dp)
                    .offset(x = (-100).dp, y = (-80).dp)
                    .background(BrandPrimary.copy(alpha = 0.08f), shape = CircleShape)
            )
            Box(
                modifier = Modifier
                    .size(320.dp)
                    .offset(x = 180.dp, y = 450.dp)
                    .background(BrandAccent.copy(alpha = 0.08f), shape = CircleShape)
            )
        }

        // Tarjeta principal de Login
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            shape = AppCardShape,
            colors = CardDefaults.cardColors(containerColor = SurfaceLight),
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Logo Insignia Bajo Zero
                Box(
                    modifier = Modifier
                        .background(BrandPrimary, shape = RoundedCornerShape(14.dp))
                        .padding(horizontal = 18.dp, vertical = 8.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "BAJO ",
                            fontWeight = FontWeight.Black,
                            fontStyle = FontStyle.Italic,
                            fontSize = 22.sp,
                            color = Color.White
                        )
                        Text(
                            text = "ZERO",
                            fontWeight = FontWeight.Black,
                            fontStyle = FontStyle.Italic,
                            fontSize = 22.sp,
                            color = Color(0xFFBAE6FD)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "REFRIGERACIÓN PANAMÁ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    letterSpacing = 2.sp,
                    color = BrandPrimary
                )
                
                Text(
                    text = "Portal de Personal Técnico",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 4.dp)
                )

                Spacer(modifier = Modifier.height(28.dp))

                // Campo de Correo Electrónico
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Correo Electrónico") },
                    placeholder = { Text("tecnico@bajozero.net", color = TextPlaceholder) },
                    leadingIcon = { 
                        Icon(
                            imageVector = Icons.Default.Email, 
                            contentDescription = null, 
                            tint = BrandPrimary 
                        ) 
                    },
                    textStyle = AppInputTextStyle,
                    modifier = Modifier.fillMaxWidth(),
                    shape = AppInputShape,
                    singleLine = true,
                    colors = appTextFieldColors()
                )
                
                Spacer(modifier = Modifier.height(16.dp))

                // Campo de Contraseña
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Contraseña") },
                    placeholder = { Text("••••••••", color = TextPlaceholder) },
                    leadingIcon = { 
                        Icon(
                            imageVector = Icons.Default.Lock, 
                            contentDescription = null, 
                            tint = BrandPrimary 
                        ) 
                    },
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = if (passwordVisible) "Ocultar" else "Mostrar",
                                tint = TextMuted
                            )
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    textStyle = AppInputTextStyle,
                    modifier = Modifier.fillMaxWidth(),
                    shape = AppInputShape,
                    singleLine = true,
                    colors = appTextFieldColors()
                )
                
                Spacer(modifier = Modifier.height(20.dp))

                if (errorMessage != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusErrorBg),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = errorMessage!!, 
                            color = StatusError,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        )
                    }
                }

                Button(
                    onClick = {
                        scope.launch {
                            isLoading = true
                            errorMessage = null
                            try {
                                supabase.auth.signInWith(Email) {
                                    this.email = email.trim()
                                    this.password = password
                                }
                                
                                val user = supabase.auth.currentUserOrNull()
                                if (user != null) {
                                    val profile = supabase.postgrest["profiles"]
                                        .select { filter { eq("id", user.id) } }
                                        .decodeSingleOrNull<Profile>()
                                        
                                    if (profile != null && profile.isActive) {
                                        val validRoles = listOf("tecnico", "supervisor", "asistente", "superadmin", "coordinador", "administrador")
                                        if (validRoles.contains(profile.role.lowercase())) {
                                            onLoginSuccess(profile.role)
                                        } else {
                                            supabase.auth.signOut()
                                            errorMessage = "Tu rol actual (${profile.role}) no tiene acceso a esta aplicación."
                                        }
                                    } else {
                                        supabase.auth.signOut()
                                        errorMessage = "Cuenta inactiva o no registrada en el sistema."
                                    }
                                }
                            } catch (e: Exception) {
                                errorMessage = "Error: Verifica tu conexión a internet o credenciales."
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = AppButtonShape,
                    enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandPrimary,
                        disabledContainerColor = BrandPrimary.copy(alpha = 0.5f)
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                    } else {
                        Text(
                            text = "Ingresar al Portal", 
                            fontWeight = FontWeight.Bold, 
                            fontSize = 15.sp,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}
