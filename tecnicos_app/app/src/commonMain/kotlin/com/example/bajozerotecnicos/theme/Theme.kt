package com.example.bajozerotecnicos.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ====================================================================
// Paleta Oficial de Colores Bajo Zero Panamá (Sincronizada con Web)
// ====================================================================
val BrandPrimary = Color(0xFF0066B2)        // Azul Principal Corporativo (#0066b2)
val BrandSecondary = Color(0xFF004C8C)      // Azul Oscuro (#004c8c)
val BrandAccent = Color(0xFF00A8E8)         // Azul Celeste Tropical / Hielo (#00a8e8)
val BrandLight = Color(0xFFE6F2FA)          // Azul Glaciar Suave para Fondos / Badges (#e6f2fa)
val BrandIce = Color(0xFFF0F7FF)            // Azul Hielo muy tenue (#f0f7ff)

val BackgroundLight = Color(0xFFF8FAFC)      // Fondo Slate 50 ultra limpio (#f8fafc)
val SurfaceLight = Color(0xFFFFFFFF)         // Superficie de tarjetas (#ffffff)

// Colores de Texto
val TextDark = Color(0xFF0F172A)             // Texto ingresado por usuario / Títulos (Slate 900: #0f172a)
val TextBody = Color(0xFF334155)             // Texto secundario de lectura (Slate 700: #334155)
val TextMuted = Color(0xFF64748B)            // Etiquetas secundarias / labels (Slate 500: #64748b)
val TextPlaceholder = Color(0xFF94A3B8)      // Texto de ejemplo / placeholder sutil (Slate 400: #94a3b8)

// Bordes y Divisores
val BorderLight = Color(0xFFCBD5E1)          // Borde suave en reposo (Slate 300: #cbd5e1)
val BorderSubtle = Color(0xFFE2E8F0)         // Separadores tenues (Slate 200: #e2e8f0)

// Estados
val StatusSuccess = Color(0xFF10B981)        // Verde completado / WhatsApp (#10b981)
val StatusSuccessBg = Color(0xFFD1FAE5)      // Fondo verde tenue (#d1fae5)
val StatusWarning = Color(0xFFF59E0B)        // Naranja pendiente (#f59e0b)
val StatusWarningBg = Color(0xFFFEF3C7)      // Fondo naranja tenue (#fef3c7)
val StatusError = Color(0xFFEF4444)          // Rojo alerta (#ef4444)
val StatusErrorBg = Color(0xFFFEE2E2)        // Fondo rojo tenue (#fee2e2)

private val LightColorScheme = lightColorScheme(
    primary = BrandPrimary,
    secondary = BrandSecondary,
    tertiary = BrandAccent,
    background = BackgroundLight,
    surface = SurfaceLight,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = TextDark,
    onSurface = TextDark,
    error = StatusError,
    onError = Color.White,
    outline = BorderLight,
    surfaceVariant = BrandLight
)

private val DarkColorScheme = darkColorScheme(
    primary = BrandAccent,
    secondary = BrandPrimary,
    tertiary = BrandLight,
    background = Color(0xFF0F172A),
    surface = Color(0xFF1E293B),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    error = StatusError,
    onError = Color.White,
    outline = Color(0xFF334155)
)

/**
 * Estilos estándar para campos de texto (OutlinedTextField):
 * - Texto introducido por el usuario: Negro / Slate 900 oscuro (TextDark).
 * - Placeholder / texto de ejemplo de fondo: Gris claro sutil (TextPlaceholder).
 * - Borde enfocado: Azul de marca (BrandPrimary).
 * - Label enfocado: Azul de marca (BrandPrimary).
 */
@Composable
fun appTextFieldColors(
    containerColor: Color = Color.White
) = OutlinedTextFieldDefaults.colors(
    focusedTextColor = TextDark,
    unfocusedTextColor = TextDark,
    focusedContainerColor = containerColor,
    unfocusedContainerColor = containerColor,
    cursorColor = BrandPrimary,
    focusedBorderColor = BrandPrimary,
    unfocusedBorderColor = BorderLight,
    focusedLabelColor = BrandPrimary,
    unfocusedLabelColor = TextMuted,
    focusedPlaceholderColor = TextPlaceholder,
    unfocusedPlaceholderColor = TextPlaceholder,
    focusedLeadingIconColor = BrandPrimary,
    unfocusedLeadingIconColor = TextMuted,
    focusedTrailingIconColor = BrandPrimary,
    unfocusedTrailingIconColor = TextMuted,
    errorTextColor = TextDark,
    errorContainerColor = containerColor,
    errorBorderColor = StatusError,
    errorLabelColor = StatusError
)

val AppInputShape = RoundedCornerShape(12.dp)
val AppCardShape = RoundedCornerShape(16.dp)
val AppButtonShape = RoundedCornerShape(12.dp)

val AppInputTextStyle = TextStyle(
    color = TextDark,
    fontWeight = FontWeight.Normal,
    fontSize = 15.sp
)

@Composable
fun BajoZeroTecnicosTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(colorScheme = colorScheme, content = content)
}
