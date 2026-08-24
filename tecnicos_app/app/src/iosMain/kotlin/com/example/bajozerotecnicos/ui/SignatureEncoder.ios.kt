package com.example.bajozerotecnicos.ui

import kotlinx.cinterop.*
import platform.CoreGraphics.*
import platform.Foundation.*
import platform.UIKit.*

@OptIn(ExperimentalForeignApi::class)
actual fun encodeSignatureLinesToBase64(lines: List<Line>, width: Int, height: Int): String {
    val size = CGSizeMake(width.toDouble(), height.toDouble())
    val renderer = UIGraphicsImageRenderer(size = size)
    val image = renderer.imageWithActions {
        UIColor.whiteColor.setFill()
        UIRectFill(CGRectMake(0.0, 0.0, width.toDouble(), height.toDouble()))
        
        val path = UIBezierPath()
        path.lineWidth = 5.0
        path.lineCapStyle = kCGLineCapRound
        UIColor.blackColor.setStroke()
        
        lines.forEach { line ->
            path.moveToPoint(CGPointMake(line.start.x.toDouble(), line.start.y.toDouble()))
            path.addLineToPoint(CGPointMake(line.end.x.toDouble(), line.end.y.toDouble()))
        }
        path.stroke()
    }
    val data = UIImagePNGRepresentation(image)
    val base64String = data?.base64EncodedStringWithOptions(0u) ?: ""
    return "data:image/png;base64,$base64String"
}
