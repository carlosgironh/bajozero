package com.example.bajozerotecnicos.ui

import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Paint
import android.util.Base64
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import java.io.ByteArrayOutputStream
import kotlinx.coroutines.launch

data class Line(val start: Offset, val end: Offset)

@Composable
fun SignaturePad(onSignatureCaptured: (String?) -> Unit) {
    val lines = remember { mutableStateListOf<Line>() }
    val coroutineScope = rememberCoroutineScope()

    Column {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(Color.White, shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
                .border(1.dp, Color(0xFFE5E7EB), shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
                .pointerInput(Unit) {
                    detectDragGestures { change, dragAmount ->
                        change.consume()
                        lines.add(Line(change.position - dragAmount, change.position))
                    }
                }
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                lines.forEach { line ->
                    drawLine(
                        color = Color.Black,
                        start = line.start,
                        end = line.end,
                        strokeWidth = 5f,
                        cap = StrokeCap.Round
                    )
                }
            }
        }
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Button(onClick = {
                lines.clear()
                onSignatureCaptured(null)
            }) { Text("Limpiar") }
            
            Button(onClick = {
                coroutineScope.launch {
                    val bitmap = Bitmap.createBitmap(800, 400, Bitmap.Config.ARGB_8888)
                    val canvas = AndroidCanvas(bitmap)
                    canvas.drawColor(android.graphics.Color.WHITE)
                    val paint = Paint().apply {
                        color = android.graphics.Color.BLACK
                        strokeWidth = 5f
                        style = Paint.Style.STROKE
                        strokeCap = Paint.Cap.ROUND
                        isAntiAlias = true
                    }
                    lines.forEach { line ->
                        canvas.drawLine(line.start.x, line.start.y, line.end.x, line.end.y, paint)
                    }
                    val outputStream = ByteArrayOutputStream()
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                    val base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
                    onSignatureCaptured("data:image/png;base64,$base64")
                }
            }) { Text("Guardar Firma") }
        }
    }
}
