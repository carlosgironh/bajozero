package com.example.bajozerotecnicos.ui

import androidx.compose.ui.geometry.Offset

data class Line(val start: Offset, val end: Offset)

expect fun encodeSignatureLinesToBase64(lines: List<Line>, width: Int, height: Int): String
