package com.example.bajozerotecnicos.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.bajozerotecnicos.models.Inspection
import com.example.bajozerotecnicos.models.ModeloRow
import com.example.bajozerotecnicos.models.TechnicalData
import com.example.bajozerotecnicos.supabase
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InspectionFormScreen(
    inspection: Inspection,
    onBack: () -> Unit,
    onSubmitSuccess: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }

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
                title = { Text("Inspección ${inspection.inspectionNumber}") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
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
                .padding(16.dp)
        ) {
            // Cabecera Cliente
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Cliente: ${inspection.client?.contactName ?: ""}")
                    Text("Teléfono: ${inspection.client?.phone ?: ""}")
                    Text("Dirección: ${inspection.client?.address ?: ""}")
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            
            Text("Tabla de Modelos", style = MaterialTheme.typography.titleLarge)
            modelos.forEachIndexed { index, modelo ->
                ModeloInputForm(modelo = modelo, onUpdate = { updated ->
                    val newList = modelos.toMutableList()
                    newList[index] = updated
                    modelos = newList
                })
                Spacer(modifier = Modifier.height(8.dp))
            }
            Button(onClick = { modelos = modelos + ModeloRow("", "", "", "", "", "", "", "", "") }) {
                Text("Agregar Modelo")
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("Detalles Adicionales", style = MaterialTheme.typography.titleLarge)
            
            // Simulating radio buttons/text fields for checklist (simplified)
            OutlinedTextField(value = pieDesague, onValueChange = { pieDesague = it }, label = { Text("Pie de tuberia de desague") })
            OutlinedTextField(value = mangaObstruida, onValueChange = { mangaObstruida = it }, label = { Text("Manga Obstruida (SI/NO/NA)") })
            OutlinedTextField(value = huecoPared, onValueChange = { huecoPared = it }, label = { Text("Hueco en pared (SI/NO)") })
            OutlinedTextField(value = instPeligrosa, onValueChange = { instPeligrosa = it }, label = { Text("Instalación peligrosa (SI/NO)") })
            OutlinedTextField(value = observaciones, onValueChange = { observaciones = it }, label = { Text("Otras observaciones") }, minLines = 3, modifier = Modifier.fillMaxWidth())
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("Firma del Cliente", style = MaterialTheme.typography.titleLarge)
            SignaturePad(onSignatureCaptured = { signatureBase64 = it })
            
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = {
                    if (signatureBase64 == null) {
                        // Normally show a snackbar or alert
                        return@Button
                    }
                    isSubmitting = true
                    scope.launch {
                        try {
                            val currentDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                            val currentTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
                            
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
                                fechaCompletado = currentDate,
                                horaCompletado = currentTime
                            )
                            
                            // Using Kotlinx Serialization inside Supabase client handles JSON conversion automatically
                            supabase.postgrest["inspections"]
                                .update(
                                    {
                                        set("status", "completada")
                                        set("technical_data", technicalData)
                                        set("completion_date", currentDate)
                                        set("completion_time", currentTime)
                                    }
                                ) {
                                    filter { eq("id", inspection.id) }
                                }
                                
                            onSubmitSuccess()
                        } catch (e: Exception) {
                            e.printStackTrace()
                            // Show error
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isSubmitting && signatureBase64 != null
            ) {
                Text(if (isSubmitting) "Guardando..." else "Completar Inspección")
            }
        }
    }
}

@Composable
fun ModeloInputForm(modelo: ModeloRow, onUpdate: (ModeloRow) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(8.dp)) {
            OutlinedTextField(value = modelo.modelo, onValueChange = { onUpdate(modelo.copy(modelo = it)) }, label = { Text("Modelo") }, modifier = Modifier.fillMaxWidth())
            Row {
                OutlinedTextField(value = modelo.instBasica, onValueChange = { onUpdate(modelo.copy(instBasica = it)) }, label = { Text("Inst. Básica") }, modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.width(4.dp))
                OutlinedTextField(value = modelo.instManga, onValueChange = { onUpdate(modelo.copy(instManga = it)) }, label = { Text("Inst. Manga") }, modifier = Modifier.weight(1f))
            }
        }
    }
}
