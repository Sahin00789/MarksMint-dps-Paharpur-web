import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfFromElement = async (element, filename = 'admit-card.pdf') => {
  try {
    // Set exact dimensions in mm (A5 landscape)
    const width = 210;  // 210mm width (A5 landscape)
    const height = 148.5; // 148.5mm height (A5 landscape)
    
    // Create a new jsPDF instance with exact dimensions
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    // Calculate scale to fit the content properly
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    const scale = Math.min(
      (width * 3.78) / elementWidth,  // 3.78 pixels per mm at 96 DPI
      (height * 3.78) / elementHeight
    );

    // Use html2canvas to capture the element with higher resolution
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: elementWidth,
      height: elementHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scale: 2 // Additional scale for better quality
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Calculate dimensions to maintain aspect ratio
    const imgWidth = width;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Center the image on the page
    const x = 0;
    const y = (height - imgHeight) / 2;

    // Add the image to the PDF
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
    
    // Save the PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const printElement = (elementId, filename = 'admit-card.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }
  
  // Add a class to indicate printing
  element.classList.add('printing');
  
  // Generate and download the PDF
  generatePdfFromElement(element, filename)
    .then(() => {
      console.log('PDF generated successfully');
    })
    .catch(error => {
      console.error('Failed to generate PDF:', error);
    })
    .finally(() => {
      // Remove the printing class
      element.classList.remove('printing');
    });
};
