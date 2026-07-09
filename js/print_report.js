async function printTaskReport(taskId) {
    try {
        // Fetch task data
        const { data: task, error } = await supabaseClient
            .from('tasks')
            .select('*, clients(*), profiles!inspector_id(full_name)')
            .eq('id', taskId)
            .single();
            
        if (error) throw error;
        
        const td = task.technical_data || {};
        const client = task.clients || {};
        const techName = task.profiles?.full_name || '';
        const modelos = td.modelos || [];
        
        // Helper to check boxes
        const check = (val, expected) => val === expected ? 'X' : '&nbsp;';
        
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Inspección - ${task.task_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            color: #000;
        }
        .main-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #0066cc;
        }
        .header {
            display: flex;
            border-bottom: 1px solid #0066cc;
        }
        .logo-box {
            background-color: #0066cc;
            color: white;
            font-weight: bold;
            font-size: 24px;
            padding: 10px 20px;
            text-align: center;
            width: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        .title-box {
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0066cc;
            font-weight: bold;
            font-size: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #0066cc;
            padding: 4px 8px;
            text-align: left;
        }
        .blue-text {
            color: #0066cc;
            font-weight: bold;
            font-size: 10px;
        }
        .centered {
            text-align: center;
        }
        .row-header {
            width: 20%;
            background-color: transparent;
            color: #0066cc;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
        }
        .equipment-table th {
            color: #0066cc;
            font-size: 9px;
            text-align: center;
            vertical-align: middle;
            padding: 6px 2px;
        }
        .equipment-table td {
            text-align: center;
            height: 25px;
        }
        .section-title {
            background-color: transparent;
            color: #0066cc;
            font-weight: bold;
            text-align: center;
            padding: 5px;
            border-top: 1px solid #0066cc;
            border-bottom: 1px solid #0066cc;
        }
        .details-table td {
            border: 1px solid #e0e0e0;
            border-left: 1px solid #0066cc;
            border-right: 1px solid #0066cc;
            padding: 5px 8px;
        }
        .details-table .blue-text {
            width: 40%;
        }
        .box {
            display: inline-block;
            width: 40px;
            height: 15px;
            border: 1px solid #0066cc;
            vertical-align: middle;
            text-align: center;
            line-height: 15px;
            font-weight: bold;
        }
        .box-large {
            width: 80px;
        }
        .check-group {
            display: inline-block;
            margin-right: 15px;
        }
        .check-label {
            color: #0066cc;
            font-weight: bold;
            font-size: 10px;
            margin-right: 5px;
            vertical-align: middle;
        }
        .obs-row {
            height: 25px;
        }
        .footer-table td {
            border: 1px solid #0066cc;
        }
        .footer-table .row-header {
            width: 15%;
        }
        .print-btn {
            display: block;
            margin: 20px auto;
            padding: 10px 20px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        @media print {
            .print-btn { display: none; }
            body { padding: 0; }
            .main-container { border: none; max-width: 100%; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Imprimir Reporte</button>
    <div class="main-container">
        <!-- HEADER -->
        <div class="header">
            <div class="logo-box">
                BAJO<br>ZERO
            </div>
            <div class="title-box">
                INSPECCION PARA INSTALACION DE AIRE ACONDICIONADO
            </div>
        </div>

        <!-- CLIENT INFO -->
        <table>
            <tr>
                <td class="row-header">NOMBRE DEL CLIENTE:</td>
                <td colspan="3" style="font-weight: bold;">${client.contact_name || ''}</td>
            </tr>
            <tr>
                <td class="row-header">DIRECCION:</td>
                <td colspan="3">${client.address || ''}</td>
            </tr>
            <tr>
                <td class="row-header">TELEFONOS:</td>
                <td colspan="3">${client.phone || ''}</td>
            </tr>
        </table>

        <!-- EQUIPMENT TABLE -->
        <table class="equipment-table">
            <tr>
                <th>MODELO</th>
                <th>INSTALACION<br>BASICA</th>
                <th>INSTALACION<br>POR MANGA</th>
                <th>INSTALACION<br>POR RECORRIDO</th>
                <th>PIES DE<br>TUBERIA</th>
                <th>CABLE DE<br>SEÑAL 4x14</th>
                <th>CABLE DE<br>SEÑAL 5x14</th>
                <th>CABLE DE<br>CORRIENTE<br>3x12</th>
                <th>SOPORTE<br>CONDENSADORA</th>
            </tr>
            ${[0,1,2,3].map(i => {
                const m = modelos[i] || {};
                return `
                <tr>
                    <td>${m.modelo || ''}</td>
                    <td>${m.inst_basica || ''}</td>
                    <td>${m.inst_manga || ''}</td>
                    <td>${m.inst_recorrido || ''}</td>
                    <td>${m.pies_tuberia || ''}</td>
                    <td>${m.cable_4x14 || ''}</td>
                    <td>${m.cable_5x14 || ''}</td>
                    <td>${m.cable_3x12 || ''}</td>
                    <td>${m.soporte || ''}</td>
                </tr>
                `;
            }).join('')}
        </table>

        <!-- DETALLES ADICIONALES -->
        <div class="section-title">DETALLES ADICIONALES</div>
        <table class="details-table">
            <tr>
                <td class="blue-text">MANGA OBSTRUIDA</td>
                <td>
                    <span class="check-group"><span class="check-label">SI</span><span class="box">${check(td.manga_obstruida, 'si')}</span></span>
                    <span class="check-group"><span class="check-label">NO</span><span class="box">${check(td.manga_obstruida, 'no')}</span></span>
                    <span class="check-group"><span class="check-label">N/A</span><span class="box">${check(td.manga_obstruida, 'na')}</span></span>
                </td>
            </tr>
            <tr>
                <td class="blue-text">PIE DE TUBERIA DE DESAGUE</td>
                <td><span class="box box-large">${td.pie_desague || ''}</span> ${td.pie_desague_detalle || ''}</td>
            </tr>
            <tr>
                <td class="blue-text">HUECO EN PARED (ESTA HECHO)</td>
                <td>
                    <span class="check-group"><span class="check-label">SI</span><span class="box">${check(td.hueco_pared, 'si')}</span></span>
                    <span class="check-group"><span class="check-label">NO</span><span class="box">${check(td.hueco_pared, 'no')}</span></span>
                </td>
            </tr>
            <tr>
                <td class="blue-text">INSTALACION PELIGROSA</td>
                <td>
                    <span class="check-group"><span class="check-label">SI</span><span class="box">${check(td.inst_peligrosa, 'si')}</span></span>
                    <span class="check-group"><span class="check-label">NO</span><span class="box">${check(td.inst_peligrosa, 'no')}</span></span>
                </td>
            </tr>
            <tr>
                <td class="blue-text">DEMOSTAR A/A</td>
                <td>
                    <span class="check-group"><span class="check-label">SI</span><span class="box">${check(td.demontar, 'si')}</span></span>
                    <span class="check-group"><span class="check-label">NO</span><span class="box">${check(td.demontar, 'no')}</span></span>
                </td>
            </tr>
            <tr>
                <td class="blue-text">REPELLAR</td>
                <td>
                    <span class="check-group"><span class="check-label">SI</span><span class="box">${check(td.repellar, 'si')}</span></span>
                    <span class="check-group"><span class="check-label">NO</span><span class="box">${check(td.repellar, 'no')}</span></span>
                </td>
            </tr>
            <tr>
                <td class="blue-text">TIENE CORRIENTE ADECUADA</td>
                <td>
                    <span class="check-group"><span class="check-label">SI</span><span class="box">${check(td.corriente, 'si')}</span></span>
                    <span class="check-group"><span class="check-label">NO</span><span class="box">${check(td.corriente, 'no')}</span></span>
                </td>
            </tr>
            <tr>
                <td class="blue-text">ALTURA</td>
                <td>
                    <span class="check-group"><span class="check-label">SI</span><span class="box">${check(td.altura, 'si')}</span></span>
                    <span class="check-group"><span class="check-label">NO</span><span class="box">${check(td.altura, 'no')}</span></span>
                    <span class="check-group"><span class="check-label">DISTANCIA</span><span class="box box-large">${td.distancia || ''}</span></span>
                </td>
            </tr>
            <tr>
                <td class="blue-text">SALIDA DE DESAGUE</td>
                <td>
                    <span class="check-group"><span class="check-label">A NIVEL</span><span class="box">${check(td.salida_desague, 'a_nivel')}</span></span>
                    <span class="check-group"><span class="check-label">ARRIBA DEL AIRE</span><span class="box">${check(td.salida_desague, 'arriba')}</span></span>
                </td>
            </tr>
        </table>

        <!-- OTRAS OBSERVACIONES -->
        <div class="section-title">OTRAS OBSERVACIONES</div>
        <table>
            <tr><td class="obs-row">${td.observaciones ? td.observaciones.substring(0, 100) : ''}</td></tr>
            <tr><td class="obs-row">${td.observaciones && td.observaciones.length > 100 ? td.observaciones.substring(100, 200) : ''}</td></tr>
            <tr><td class="obs-row">${td.observaciones && td.observaciones.length > 200 ? td.observaciones.substring(200, 300) : ''}</td></tr>
            <tr><td class="obs-row"></td></tr>
        </table>

        <!-- FOOTER -->
        <table class="footer-table" style="border-top: 5px solid #0066cc;">
            <tr>
                <td class="row-header">TECNICO:</td>
                <td>${techName}</td>
            </tr>
            <tr>
                <td class="row-header">FECHA:</td>
                <td>${td.fecha_completado || task.completion_date || ''}</td>
            </tr>
            <tr>
                <td class="row-header">HORA:</td>
                <td>${td.hora_completado || task.completion_time || ''}</td>
            </tr>
        </table>
    </div>
</body>
</html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Let images and styles load before triggering print dialog
        setTimeout(() => {
            printWindow.focus();
        }, 500);

    } catch (error) {
        console.error('Error al generar reporte de impresión:', error);
        alert('Error al generar el reporte: ' + error.message);
    }
}
