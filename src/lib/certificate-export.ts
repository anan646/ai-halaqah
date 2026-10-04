import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface CertificateExportOptions {
  scale?: number;
  filename?: string;
}

/**
 * Exports a certificate element to a 100% pixel-perfect A4 Landscape PDF.
 * Uses high-resolution canvas capture (3x supersampling) to ensure text,
 * vectors, background gradients, borders, and signatures match the web app display exactly.
 */
export async function exportCertificateToPdf(
  elementIdOrElement: string | HTMLElement,
  filename: string = 'เกียรติบัตร.pdf',
  options: CertificateExportOptions = {}
): Promise<boolean> {
  const element =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!element) {
    console.error('Certificate element not found:', elementIdOrElement);
    return false;
  }

  const scale = options.scale || 3;

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const id = typeof elementIdOrElement === 'string' ? elementIdOrElement : element.id;
        const clonedEl = id ? clonedDoc.getElementById(id) : null;
        if (clonedEl) {
          // Remove modal-specific border-radius & box-shadow so the exported certificate is full-bleed A4 sheet
          clonedEl.style.borderRadius = '0px';
          clonedEl.style.boxShadow = 'none';
        }
        // Ensure images don't block canvas exporting
        const imgs = clonedDoc.getElementsByTagName('img');
        for (let i = 0; i < imgs.length; i++) {
          imgs[i].crossOrigin = 'anonymous';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const format = imgData.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';

    // Standard A4 Landscape: 297mm width x 210mm height
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Fill entire A4 landscape page with exact proportions (0, 0, 297mm, 210mm)
    pdf.addImage(imgData, format, 0, 0, 297, 210, undefined, 'FAST');

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('Failed to export certificate to PDF:', err);
    throw err;
  }
}

/**
 * Prints a certificate with exact styling, colors, and background graphics.
 * Converts the rendered DOM into a high-res image before opening the print dialog
 * to prevent browser engines from stripping CSS backgrounds and gradients.
 */
export async function printCertificate(
  elementIdOrElement: string | HTMLElement,
  title: string = 'เกียรติบัตร'
): Promise<boolean> {
  const element =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!element) {
    window.print();
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const id = typeof elementIdOrElement === 'string' ? elementIdOrElement : element.id;
        const clonedEl = id ? clonedDoc.getElementById(id) : null;
        if (clonedEl) {
          clonedEl.style.borderRadius = '0px';
          clonedEl.style.boxShadow = 'none';
        }
        const imgs = clonedDoc.getElementsByTagName('img');
        for (let i = 0; i < imgs.length; i++) {
          imgs[i].crossOrigin = 'anonymous';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    const printHtml = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          img {
            width: 297mm;
            height: 210mm;
            object-fit: fill;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${imgData}" alt="Certificate" />
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    // Try popup window first
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      return true;
    }

    // Popup was blocked: print via hidden iframe seamlessly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printHtml);
      iframeDoc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 400);
      return true;
    }

    window.print();
    return true;
  } catch (err) {
    console.error('Failed to print certificate via canvas, falling back to window.print():', err);
    window.print();
    return false;
  }
}
