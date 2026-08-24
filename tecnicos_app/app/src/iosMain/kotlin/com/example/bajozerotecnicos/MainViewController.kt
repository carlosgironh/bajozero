package com.example.bajozerotecnicos

import androidx.compose.ui.window.ComposeUIViewController
import com.example.bajozerotecnicos.ui.App
import platform.UIKit.UIViewController

fun MainViewController(): UIViewController = ComposeUIViewController {
    App()
}
