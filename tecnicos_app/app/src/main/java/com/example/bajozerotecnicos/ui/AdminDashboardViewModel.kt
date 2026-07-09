package com.example.bajozerotecnicos.ui

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.bajozerotecnicos.models.Inspection
import com.example.bajozerotecnicos.supabase
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AdminDashboardViewModel : ViewModel() {
    private val _totalTasks = MutableStateFlow(0)
    val totalTasks: StateFlow<Int> = _totalTasks.asStateFlow()

    private val _pendingTasks = MutableStateFlow(0)
    val pendingTasks: StateFlow<Int> = _pendingTasks.asStateFlow()

    private val _completedTasks = MutableStateFlow(0)
    val completedTasks: StateFlow<Int> = _completedTasks.asStateFlow()

    private val _recentTasks = MutableStateFlow<List<Inspection>>(emptyList())
    val recentTasks: StateFlow<List<Inspection>> = _recentTasks.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Fetch all tasks
                val allTasks = supabase.postgrest["tasks"]
                    .select {
                        // TODO: maybe fetch joined clients
                    }
                    .decodeList<Inspection>()

                _totalTasks.value = allTasks.size
                _pendingTasks.value = allTasks.count { it.status == "asignada" || it.status == "pendiente" }
                _completedTasks.value = allTasks.count { it.status == "completada" }
                
                // Top 5 recent tasks
                _recentTasks.value = allTasks.sortedByDescending { it.inspectionNumber }.take(5)

            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
}
