package com.example.bajozerotecnicos.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val PrimaryBrandBlue = Color(0xFF0284C7)
val SecondaryBrandBlue = Color(0xFF0369A1)
val TertiaryBrandBlue = Color(0xFF0EA5E9)
val BackgroundLight = Color(0xFFF8FAFC)
val SurfaceLight = Color(0xFFFFFFFF)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryBrandBlue,
    secondary = SecondaryBrandBlue,
    tertiary = TertiaryBrandBlue
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryBrandBlue,
    secondary = SecondaryBrandBlue,
    tertiary = TertiaryBrandBlue,
    background = BackgroundLight,
    surface = SurfaceLight,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF111827),
    onSurface = Color(0xFF111827)
)

@Composable
fun BajoZeroTecnicosTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(colorScheme = colorScheme, content = content)
}
