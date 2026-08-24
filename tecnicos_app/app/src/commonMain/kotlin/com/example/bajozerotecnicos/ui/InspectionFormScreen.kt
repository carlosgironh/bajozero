package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.bajozerotecnicos.models.Inspection
import com.example.bajozerotecnicos.models.ModeloRow
import com.example.bajozerotecnicos.models.TechnicalData
import com.example.bajozerotecnicos.supabase
import com.example.bajozerotecnicos.theme.*
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InspectionFormScreen(
    inspection: Inspection,
    onBack: () -> Unit,
    onSubmitSuccess: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }
    var submitError by remember { mutableStateOf<String?>(null) }

    // Form state
    var modelos by remember { mutableStateOf(listOf(ModeloRow("", "", "", "", "", "", "", "", ""))) }
    
    // Checklist
    var mangaObstruida by remember { mutableStateOf("N/A") }
    var pieDesague by remember { mutableStateOf("") }
    var pieDesagueDetalle by remember { mutableStateOf("") }
    var huecoPared by remember { mutableStateOf("NO") }
    var instPeligrosa by remember { mutableStateOf("NO") }
    var demontar by remember { mutableStateOf("NO") }
    var repellar by remember { mutableStateOf("NO") }
    var corriente by remember { mutableStateOf("NO") }
    var altura by remember { mutableStateOf("NO") }
    var distancia by remember { mutableStateOf("") }
    var salidaDesague by remember { mutableStateOf("A NIVEL") }
    
    var observaciones by remember { mutableStateOf("") }
    var signatureBase64 by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Inspección ${inspection.inspectionNumber ?: ""}", 
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    ) 
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandPrimary,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Cabecera Cliente
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = AppCardShape,
                colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                border = BorderStroke(1.dp, BorderSubtle),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Cliente: ${inspection.client?.contactName ?: "General"}", 
                        fontWeight = FontWeight.Bold, 
                        style = MaterialTheme.typography.titleMedium,
                        color = TextDark
                    )
                    val client = inspection.client
                    if (client != null) {
                        if (!client.phone.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Teléfono: ${client.phone}", color = TextMuted, style = MaterialTheme.typography.bodyMedium)
                        }
                        if (!client.address.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(2.dp))
                            Text("Dirección: ${client.address}", color = TextMuted, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
            
            // Sección de Modelos de Equipos
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = AppCardShape,
                colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                border = BorderStroke(1.dp, BorderSubtle),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Equipos / Modelos Atendidos", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold,
                        color = BrandPrimary
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    modelos.forEachIndexed { index, modelo ->
                        ModeloInputForm(
                            index = index + 1,
                            modelo = modelo, 
                            onUpdate = { updated ->
                                val newList = modelos.toMutableList()
                                newList[index] = updated
                                modelos = newList
                            },
                            onDelete = {
                                if (modelos.size > 1) {
                                    val newList = modelos.toMutableList()
                                    newList.removeAt(index)
                                    modelos = newList
                                }
                            }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    OutlinedButton(
                        onClick = { modelos = modelos + ModeloRow("", "", "", "", "", "", "", "", "") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = BrandPrimary
                        ),
                        border = BorderStroke(1.dp, BrandPrimary)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Agregar Otro Equipo", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            
            // Checklist de Verificaciones
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = AppCardShape,
                colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                border = BorderStroke(1.dp, BorderSubtle),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Verificaciones Técnicas", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold,
                        color = BrandPrimary
                    )

                    OutlinedTextField(
                        value = mangaObstruida, 
                        onValueChange = { mangaObstruida = it }, 
                        label = { Text("Manga Obstruida") },
                        placeholder = { Text("SI / NO / N/A", color = TextPlaceholder) },
                        textStyle = AppInputTextStyle,
                        colors = appTextFieldColors(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape
                    )

                    OutlinedTextField(
                        value = pieDesague, 
                        onValueChange = { pieDesague = it }, 
                        label = { Text("Pie de Tubería de Desagüe") },
                        placeholder = { Text("SI / NO", color = TextPlaceholder) },
                        textStyle = AppInputTextStyle,
                        colors = appTextFieldColors(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape
                    )

                    OutlinedTextField(
                        value = huecoPared, 
                        onValueChange = { huecoPared = it }, 
                        label = { Text("Hueco en Pared") },
                        placeholder = { Text("SI / NO", color = TextPlaceholder) },
                        textStyle = AppInputTextStyle,
                        colors = appTextFieldColors(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape
                    )

                    OutlinedTextField(
                        value = instPeligrosa, 
                        onValueChange = { instPeligrosa = it }, 
                        label = { Text("Instalación Peligrosa") },
                        placeholder = { Text("SI / NO", color = TextPlaceholder) },
                        textStyle = AppInputTextStyle,
                        colors = appTextFieldColors(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape
                    )

                    OutlinedTextField(
                        value = corriente, 
                        onValueChange = { corriente = it }, 
                        label = { Text("Corriente Adecuada") },
                        placeholder = { Text("SI / NO", color = TextPlaceholder) },
                        textStyle = AppInputTextStyle,
                        colors = appTextFieldColors(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape
                    )

                    OutlinedTextField(
                        value = salidaDesague, 
                        onValueChange = { salidaDesague = it }, 
                        label = { Text("Salida de Desagüe") },
                        placeholder = { Text("A NIVEL / ARRIBA", color = TextPlaceholder) },
                        textStyle = AppInputTextStyle,
                        colors = appTextFieldColors(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape
                    )

                    OutlinedTextField(
                        value = observaciones, 
                        onValueChange = { observaciones = it }, 
                        label = { Text("Observaciones del Técnico") }, 
                        placeholder = { Text("Detalles adicionales, recomendaciones, etc.", color = TextPlaceholder) },
                        textStyle = AppInputTextStyle,
                        colors = appTextFieldColors(),
                        minLines = 3, 
                        modifier = Modifier.fillMaxWidth(),
                        shape = AppInputShape
                    )
                }
            }
            
            // Firma Digital del Cliente
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = AppCardShape,
                colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                border = BorderStroke(1.dp, BorderSubtle),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Firma de Conformidad del Cliente *", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold,
                        color = BrandPrimary
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    SignaturePad(onSignatureCaptured = { signatureBase64 = it })
                }
            }
            
            if (submitError != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = StatusErrorBg),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = submitError!!,
                        color = StatusError,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            Button(
                onClick = {
                    if (signatureBase64.isNullOrBlank()) {
                        submitError = "La firma del cliente es obligatoria para completar la orden."
                        return@Button
                    }
                    isSubmitting = true
                    submitError = null
                    scope.launch {
                        try {
                            val technicalData = TechnicalData(
                                modelos = modelos,
                                mangaObstruida = mangaObstruida,
                                pieDesague = pieDesague,
                                pieDesagueDetalle = pieDesagueDetalle,
                                huecoPared = huecoPared,
                                instPeligrosa = instPeligrosa,
                                demontar = demontar,
                                repellar = repellar,
                                corriente = corriente,
                                altura = altura,
                                distancia = distancia,
                                salidaDesague = salidaDesague,
                                observaciones = observaciones,
                                firmaCliente = signatureBase64!!,
                                fechaCompletado = "",
                                horaCompletado = ""
                            )
                            
                            supabase.postgrest["tasks"]
                                .update(
                                    {
                                        set("status", "completada")
                                        set("technical_data", technicalData)
                                    }
                                ) {
                                    filter { eq("id", inspection.id) }
                                }
                                
                            onSubmitSuccess()
                        } catch (e: Exception) {
                            submitError = "Error al guardar inspección: " + (e.message ?: "Intente nuevamente")
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = AppButtonShape,
                enabled = !isSubmitting && !signatureBase64.isNullOrBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandPrimary,
                    disabledContainerColor = BrandPrimary.copy(alpha = 0.5f)
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                } else {
                    Text(
                        "Completar y Guardar Inspección", 
                        fontWeight = FontWeight.Bold, 
                        fontSize = 15.sp,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun ModeloInputForm(
    index: Int,
    modelo: ModeloRow, 
    onUpdate: (ModeloRow) -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = AppInputShape,
        colors = CardDefaults.cardColors(containerColor = BackgroundLight),
        border = BorderStroke(1.dp, BorderSubtle)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Equipo #$index", 
                    fontWeight = FontWeight.Bold, 
                    color = TextDark, 
                    style = MaterialTheme.typography.bodyMedium
                )
                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = StatusError, modifier = Modifier.size(18.dp))
                }
            }

            OutlinedTextField(
                value = modelo.modelo, 
                onValueChange = { onUpdate(modelo.copy(modelo = it)) }, 
                label = { Text("Modelo / Capacidad BTU") }, 
                placeholder = { Text("Ej. LG 12000 BTU Inverter", color = TextPlaceholder) },
                textStyle = AppInputTextStyle,
                colors = appTextFieldColors(containerColor = SurfaceLight),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            )
            
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = modelo.instBasica, 
                    onValueChange = { onUpdate(modelo.copy(instBasica = it)) }, 
                    label = { Text("Inst. Básica") }, 
                    placeholder = { Text("SI / NO", color = TextPlaceholder) },
                    textStyle = AppInputTextStyle,
                    colors = appTextFieldColors(containerColor = SurfaceLight),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                )
                OutlinedTextField(
                    value = modelo.piesTuberia, 
                    onValueChange = { onUpdate(modelo.copy(piesTuberia = it)) }, 
                    label = { Text("Pies Tubería") }, 
                    placeholder = { Text("Ej. 10 ft", color = TextPlaceholder) },
                    textStyle = AppInputTextStyle,
                    colors = appTextFieldColors(containerColor = SurfaceLight),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = modelo.cable4x14, 
                    onValueChange = { onUpdate(modelo.copy(cable4x14 = it)) }, 
                    label = { Text("Cable 4x14") }, 
                    placeholder = { Text("Ej. 15 ft", color = TextPlaceholder) },
                    textStyle = AppInputTextStyle,
                    colors = appTextFieldColors(containerColor = SurfaceLight),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                )
                OutlinedTextField(
                    value = modelo.soporte, 
                    onValueChange = { onUpdate(modelo.copy(soporte = it)) }, 
                    label = { Text("Soporte Cond.") }, 
                    placeholder = { Text("Piso / Pared", color = TextPlaceholder) },
                    textStyle = AppInputTextStyle,
                    colors = appTextFieldColors(containerColor = SurfaceLight),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                )
            }
        }
    }
}
