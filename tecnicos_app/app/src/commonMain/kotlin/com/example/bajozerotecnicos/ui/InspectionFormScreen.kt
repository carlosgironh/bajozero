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
import com.example.bajozerotecnicos.models.Inspection
import com.example.bajozerotecnicos.models.ModeloRow
import com.example.bajozerotecnicos.models.TechnicalData
import com.example.bajozerotecnicos.supabase
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
                title = { Text("Inspección ${inspection.inspectionNumber ?: ""}", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
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
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Cliente: ${inspection.client?.contactName ?: "General"}", 
                        fontWeight = FontWeight.Bold, 
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF0F172A)
                    )
                    val client = inspection.client
                    if (client != null) {
                        if (!client.phone.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Teléfono: ${client.phone}", color = Color.Gray, style = MaterialTheme.typography.bodyMedium)
                        }
                        if (!client.address.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(2.dp))
                            Text("Dirección: ${client.address}", color = Color.Gray, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
            
            // Sección de Modelos de Equipos
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Equipos / Modelos Atendidos", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
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
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Agregar Otro Equipo")
                    }
                }
            }
            
            // Checklist de Verificaciones
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Verificaciones Técnicas", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    OutlinedTextField(
                        value = mangaObstruida, 
                        onValueChange = { mangaObstruida = it }, 
                        label = { Text("Manga Obstruida (SI / NO / N/A)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = pieDesague, 
                        onValueChange = { pieDesague = it }, 
                        label = { Text("Pie de Tubería de Desagüe (SI / NO)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = huecoPared, 
                        onValueChange = { huecoPared = it }, 
                        label = { Text("Hueco en Pared (SI / NO)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = instPeligrosa, 
                        onValueChange = { instPeligrosa = it }, 
                        label = { Text("Instalación Peligrosa (SI / NO)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = corriente, 
                        onValueChange = { corriente = it }, 
                        label = { Text("Corriente Adecuada (SI / NO)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = salidaDesague, 
                        onValueChange = { salidaDesague = it }, 
                        label = { Text("Salida de Desagüe (A NIVEL / ARRIBA)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = observaciones, 
                        onValueChange = { observaciones = it }, 
                        label = { Text("Observaciones del Técnico") }, 
                        minLines = 3, 
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
            
            // Firma Digital del Cliente
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Firma de Conformidad del Cliente *", 
                        style = MaterialTheme.typography.titleMedium, 
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    SignaturePad(onSignatureCaptured = { signatureBase64 = it })
                }
            }
            
            if (submitError != null) {
                Text(
                    text = submitError!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
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
                shape = RoundedCornerShape(12.dp),
                enabled = !isSubmitting && !signatureBase64.isNullOrBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                } else {
                    Text("Completar y Guardar Inspección", fontWeight = FontWeight.Bold, color = Color.White)
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
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Equipo #$index", fontWeight = FontWeight.Bold, color = Color(0xFF334155), style = MaterialTheme.typography.bodyMedium)
                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = Color.Red, modifier = Modifier.size(18.dp))
                }
            }

            OutlinedTextField(
                value = modelo.modelo, 
                onValueChange = { onUpdate(modelo.copy(modelo = it)) }, 
                label = { Text("Modelo / Capacidad BTU") }, 
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp)
            )
            
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = modelo.instBasica, 
                    onValueChange = { onUpdate(modelo.copy(instBasica = it)) }, 
                    label = { Text("Inst. Básica") }, 
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                )
                OutlinedTextField(
                    value = modelo.piesTuberia, 
                    onValueChange = { onUpdate(modelo.copy(piesTuberia = it)) }, 
                    label = { Text("Pies Tubería") }, 
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = modelo.cable4x14, 
                    onValueChange = { onUpdate(modelo.copy(cable4x14 = it)) }, 
                    label = { Text("Cable Señal 4x14") }, 
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                )
                OutlinedTextField(
                    value = modelo.soporte, 
                    onValueChange = { onUpdate(modelo.copy(soporte = it)) }, 
                    label = { Text("Soporte Cond.") }, 
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                )
            }
        }
    }
}
