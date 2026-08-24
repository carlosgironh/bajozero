package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.bajozerotecnicos.theme.*
import kotlinx.coroutines.launch

@Composable
fun SignaturePad(onSignatureCaptured: (String?) -> Unit) {
    val lines = remember { mutableStateListOf<Line>() }
    val coroutineScope = rememberCoroutineScope()
    var hasSignature by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(SurfaceLight, shape = AppInputShape)
                .border(1.5.dp, if (hasSignature) BrandPrimary else BorderSubtle, shape = AppInputShape)
                .pointerInput(Unit) {
                    detectDragGestures { change, dragAmount ->
                        change.consume()
                        lines.add(Line(change.position - dragAmount, change.position))
                        hasSignature = true
                    }
                }
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                lines.forEach { line ->
                    drawLine(
                        color = TextDark,
                        start = line.start,
                        end = line.end,
                        strokeWidth = 5f,
                        cap = StrokeCap.Round
                    )
                }
            }

            if (lines.isEmpty()) {
                Text(
                    text = "Dibuje la firma del cliente aquí con el dedo o lápiz...",
                    color = TextPlaceholder,
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = {
                    lines.clear()
                    hasSignature = false
                    onSignatureCaptured(null)
                },
                modifier = Modifier.weight(1f),
                shape = AppButtonShape
            ) {
                Text("Limpiar Firma", color = TextMuted, fontWeight = FontWeight.SemiBold)
            }
            
            Button(
                onClick = {
                    if (lines.isNotEmpty()) {
                        coroutineScope.launch {
                            val base64 = encodeSignatureLinesToBase64(lines, 800, 400)
                            onSignatureCaptured(base64)
                        }
                    }
                },
                modifier = Modifier.weight(1f),
                shape = AppButtonShape,
                enabled = lines.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandPrimary,
                    disabledContainerColor = BrandPrimary.copy(alpha = 0.5f)
                )
            ) {
                Text("Confirmar Firma", fontWeight = FontWeight.Bold, color = Color.White)
            }
        }
    }
}
