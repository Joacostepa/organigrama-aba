export async function exportToPNG(element, filename, theme) {
  const html2canvas = (await import('html2canvas')).default;
  const bgColor = theme === 'light' ? '#f3f4f6' : '#0a0e14';

  const canvas = await html2canvas(element, {
    backgroundColor: bgColor,
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export async function exportToPDF(element, filename, theme) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');
  const bgColor = theme === 'light' ? '#f3f4f6' : '#0a0e14';

  const canvas = await html2canvas(element, {
    backgroundColor: bgColor,
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [imgWidth / 2, imgHeight / 2] });
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth / 2, imgHeight / 2);
  pdf.save(filename);
}
