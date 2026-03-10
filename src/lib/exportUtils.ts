import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateForDisplay } from './dateUtils';

// Represents the simplified data block we need for both formats
export interface CommissionExportData {
    periodLabel: string;
    agentName: string;
    dateRangeStr: string;
    metrics: {
        totalGross: number;
        totalTds: number;
        totalShared: number;
        netPayable: number;
        dealCount: number;
    };
    records: {
        id: string; // Internal, not necessarily shown
        referenceId: string;
        dealType: string;
        dealDate: string;
        dealValue: number;
        tds: number;
        sharedAmount: number;
        sharedDetails: string;
        netCommission: number;
        status: string;
    }[];
}

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const exportCommissionToExcel = (data: CommissionExportData) => {
    // 1. Prepare Columns for Array of Arrays
    const headers = [
        ['COMMISSION STATEMENT'],
        [`Agent Name: ${data.agentName}`],
        [`Period: ${data.periodLabel} (${data.dateRangeStr})`],
        [''], // Empty row
        ['--- SUMMARY ---'],
        ['Total Gross Commission', formatCurrency(data.metrics.totalGross)],
        ['Total TDS Deducted', formatCurrency(data.metrics.totalTds)],
        ['Total Shared Amount', formatCurrency(data.metrics.totalShared)],
        ['Net Commission Receivable', formatCurrency(data.metrics.netPayable)],
        ['Total Deals in Period', data.metrics.dealCount.toString()],
        [''],
        ['--- DEAL BREAKDOWN ---'],
        [
            'Sr. No.',
            'Deal Reference',
            'Deal Type',
            'Deal Date',
            'Total Deal Value',
            'TDS Deducted',
            'Shared with Brokers',
            'Shared Details (Broker Name & ID)',
            'Your Commission (Net)',
            'Status'
        ]
    ];

    const rows = data.records.map((r, i) => [
        i + 1,
        r.referenceId,
        r.dealType === 'property_dosti' ? 'Property Dosti Deal' : 'Outside Deal',
        formatDateForDisplay(r.dealDate),
        r.dealValue,
        r.tds,
        r.sharedAmount,
        r.sharedDetails,
        r.netCommission,
        r.status
    ]);

    // Combine Header + Rows
    const worksheetData = [...headers, ...rows];

    // Create Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-size a bit based on headers (rough approximation)
    worksheet['!cols'] = [
        { wch: 8 },  // Sr No
        { wch: 20 }, // Reference
        { wch: 22 }, // Deal Type
        { wch: 15 }, // Date
        { wch: 18 }, // Value
        { wch: 15 }, // TDS
        { wch: 18 }, // Shared
        { wch: 45 }, // Shared Details
        { wch: 22 }, // Net
        { wch: 10 }  // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commission Statement');

    // Generate filename
    const sanitizedName = data.agentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedPeriod = data.periodLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `commission_statement_${sanitizedName}_${sanitizedPeriod}.xlsx`;

    XLSX.writeFile(workbook, fileName);
};

export const exportCommissionToPDF = (data: CommissionExportData) => {
    const doc = new jsPDF() as any; // Cast to access autoTable if typings are stubborn

    const startY = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('COMMISSION STATEMENT', 14, startY);

    // Metadata
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Agent Name: ${data.agentName}`, 14, startY + 10);
    doc.text(`Period: ${data.periodLabel} (${data.dateRangeStr})`, 14, startY + 16);
    doc.text(`Report Generated On: ${formatDateForDisplay(new Date().toISOString())}`, 14, startY + 22);

    // Summary Box
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, startY + 30, 182, 35, 'FD'); // Filled rectangle
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('SUMMARY', 18, startY + 37);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Gross Commission:`, 18, startY + 45);
    doc.text(formatCurrency(data.metrics.totalGross), 80, startY + 45);
    doc.text(`Total TDS Deducted:`, 18, startY + 51);
    doc.text(formatCurrency(data.metrics.totalTds), 80, startY + 51);
    doc.text(`Total Shared Amount:`, 18, startY + 57);
    doc.text(formatCurrency(data.metrics.totalShared), 80, startY + 57);

    doc.setFont("helvetica", "bold");
    doc.text(`Net Commission Receivable:`, 110, startY + 51);
    doc.text(formatCurrency(data.metrics.netPayable), 165, startY + 51);
    doc.text(`Total Deals: ${data.metrics.dealCount}`, 110, startY + 57);

    // Table
    const tableColumns = [
        "No.",
        "Reference",
        "Type",
        "Date",
        "Value",
        "TDS",
        "Shared",
        "Shared Details",
        "Net"
    ];

    const tableRows = data.records.map((r, i) => [
        (i + 1).toString(),
        r.referenceId,
        r.dealType === 'property_dosti' ? 'PD Deal' : 'Outside',
        formatDateForDisplay(r.dealDate),
        r.dealValue.toLocaleString('en-IN'),
        r.tds.toLocaleString('en-IN'),
        r.sharedAmount.toLocaleString('en-IN'),
        r.sharedDetails,
        r.netCommission.toLocaleString('en-IN')
    ]);

    autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: startY + 75,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181] }, // Indigo-ish header
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: {
            0: { cellWidth: 8 },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { cellWidth: 35 },
            8: { halign: 'right', fontStyle: 'bold' }
        }
    });

    const sanitizedName = data.agentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedPeriod = data.periodLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `commission_statement_${sanitizedName}_${sanitizedPeriod}.pdf`;

    doc.save(fileName);
};
