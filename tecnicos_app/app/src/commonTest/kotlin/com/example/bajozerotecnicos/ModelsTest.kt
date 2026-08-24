package com.example.bajozerotecnicos

import com.example.bajozerotecnicos.models.ModeloRow
import com.example.bajozerotecnicos.models.Profile
import com.example.bajozerotecnicos.models.TechnicalData
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ModelsTest {

    @Test
    fun testProfileModelCreation() {
        val profile = Profile(
            id = "test-uuid",
            email = "tecnico@bajozero.net",
            fullName = "Juan Perez",
            role = "tecnico",
            isActive = true
        )
        assertEquals("test-uuid", profile.id)
        assertEquals("tecnico@bajozero.net", profile.email)
        assertEquals("tecnico", profile.role)
        assertTrue(profile.isActive)
    }

    @Test
    fun testTechnicalDataDefaultValues() {
        val techData = TechnicalData()
        assertEquals("N/A", techData.mangaObstruida)
        assertEquals("NO", techData.huecoPared)
        assertEquals("NO", techData.instPeligrosa)
        assertEquals("A NIVEL", techData.salidaDesague)
        assertTrue(techData.modelos.isEmpty())
    }

    @Test
    fun testModeloRowCreation() {
        val row = ModeloRow(
            modelo = "Split 12000 BTU",
            instBasica = "SI",
            piesTuberia = "15",
            cable4x14 = "15"
        )
        assertEquals("Split 12000 BTU", row.modelo)
        assertEquals("SI", row.instBasica)
        assertEquals("15", row.piesTuberia)
    }
}
