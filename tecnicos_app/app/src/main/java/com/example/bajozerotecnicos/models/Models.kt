package com.example.bajozerotecnicos.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class Profile(
    val id: String,
    val email: String,
    @SerialName("full_name") val fullName: String?,
    val role: String,
    @SerialName("is_active") val isActive: Boolean
)

@Serializable
data class Client(
    val id: String,
    @SerialName("contact_name") val contactName: String,
    val phone: String?,
    val address: String?
)

@Serializable
data class ModeloRow(
    val modelo: String,
    @SerialName("inst_basica") val instBasica: String,
    @SerialName("inst_manga") val instManga: String,
    @SerialName("inst_recorrido") val instRecorrido: String,
    @SerialName("pies_tuberia") val piesTuberia: String,
    @SerialName("cable_4x14") val cable4x14: String,
    @SerialName("cable_5x14") val cable5x14: String,
    @SerialName("cable_3x12") val cable3x12: String,
    val soporte: String
)

@Serializable
data class TechnicalData(
    val modelos: List<ModeloRow>,
    @SerialName("manga_obstruida") val mangaObstruida: String,
    @SerialName("pie_desague") val pieDesague: String,
    @SerialName("pie_desague_detalle") val pieDesagueDetalle: String,
    @SerialName("hueco_pared") val huecoPared: String,
    @SerialName("inst_peligrosa") val instPeligrosa: String,
    val demontar: String,
    val repellar: String,
    val corriente: String,
    val altura: String,
    val distancia: String,
    @SerialName("salida_desague") val salidaDesague: String,
    val observaciones: String,
    @SerialName("firma_cliente") val firmaCliente: String,
    @SerialName("fecha_completado") val fechaCompletado: String,
    @SerialName("hora_completado") val horaCompletado: String
)

@Serializable
data class Inspection(
    val id: String,
    @SerialName("inspection_number") val inspectionNumber: String? = null,
    @SerialName("client_id") val clientId: String?,
    @SerialName("inspector_id") val inspectorId: String?,
    val status: String? = "pendiente",
    @SerialName("scheduled_date") val scheduledDate: String? = null,
    @SerialName("completion_date") val completionDate: String? = null,
    @SerialName("completion_time") val completionTime: String? = null,
    @SerialName("technical_data") val technicalData: kotlinx.serialization.json.JsonElement? = null,
    val notes: String? = null,
    @SerialName("clients") val client: Client? = null
)
