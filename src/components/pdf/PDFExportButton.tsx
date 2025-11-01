import React from 'react';
import { pdf, Document, Page, Text, Font } from '@react-pdf/renderer';
import { HiOutlinePrinter } from 'react-icons/hi';

// Register Tajawal Arabic font for fallback PDF
try {
  Font.register({
    family: 'Tajawal',
    fonts: [
      {
        src: '/fonts/Tajawal/Tajawal-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: '/fonts/Tajawal/Tajawal-Bold.ttf',
        fontWeight: 'bold',
      },
    ],
  });
} catch (error) {
  console.warn('Failed to register Tajawal font:', error);
}

interface PDFExportButtonProps {
  orders: any[];
  filter?: string;
  paymentFilter?: string;
  opticFilter?: string | null;
  className?: string;
  children?: React.ReactNode;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  orders,
  filter = "ALL",
  paymentFilter = "ALL",
  opticFilter = null,
  className = "",
  children
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleExportPDF = async () => {
    try {
      setIsGenerating(true);
      
      // Validate orders data
      if (!orders || orders.length === 0) {
        alert('No orders data available to export.');
        return;
      }
      
      // Clean and validate orders data
      const cleanedOrders = orders.map(order => ({
        ...order,
        // Ensure all required fields have safe values
        id: order.id || 0,
        clientName: order.clientName || 'N/A',
        clientTel: order.clientTel || 'N/A',
        status: order.status || 'PENDING',
        paymentStatus: order.paymentStatus || 'UNPAID',
        remainingAmount: Number(order.remainingAmount) || 0,
        totalPrice: Number(order.totalPrice) || 0,
        createdAt: order.createdAt || new Date().toISOString(),
        optic: order.optic ? {
          ...order.optic,
          opticName: order.optic.opticName || 'N/A'
        } : null,
        category: order.category ? {
          ...order.category,
          name: order.category.name || 'N/A'
        } : null
      }));
      
      // Dynamically import the PDF component to avoid SSR issues
      const { default: ExternalOrdersPDF } = await import('./ExternalOrdersPDF');
      
      // Create PDF blob with error handling
      const pdfDoc = ExternalOrdersPDF({ 
        orders: cleanedOrders, 
        filter: filter || 'ALL', 
        paymentFilter: paymentFilter || 'ALL', 
        opticFilter: opticFilter || null
      });
      
      // Add timeout to prevent hanging
      const pdfPromise = pdf(pdfDoc).toBlob();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
      );
      
      const blob = await Promise.race([pdfPromise, timeoutPromise]) as Blob;
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `external-orders-first-20-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Try to create a simple fallback PDF
      try {
        const formatCurrency = (amount: number) => {
          try {
            if (isNaN(amount) || amount === null || amount === undefined) {
              return '0.00 TND';
            }
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'TND'
            }).format(amount);
          } catch (error) {
            return `${amount || 0} TND`;
          }
        };
        
        const fallbackDoc = (
          <Document>
            <Page size="A4" style={{ padding: 0, fontSize: 12 }}>
              {/* Header */}
              <View style={{ backgroundColor: '#1e40af', padding: 20, marginBottom: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginRight: 10, fontFamily: 'Tajawal' }}>
                      الأمانة البصريات
                    </Text>
                    <Text style={{ fontSize: 14, color: '#e0e7ff' }}>
                      El Emana Optique
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>
                      Rapport des Commandes
                    </Text>
                    <Text style={{ fontSize: 10, color: '#c7d2fe' }}>
                      {new Date().toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Content */}
              <View style={{ padding: 30 }}>
                <Text style={{ fontSize: 14, marginBottom: 15, fontWeight: 'bold', fontFamily: 'Tajawal' }}>
                  Commandes Externes / External Orders
                </Text>
                <Text style={{ marginBottom: 10, fontFamily: 'Tajawal' }}>
                  Total des commandes: {orders.length}
                </Text>
                <Text style={{ marginBottom: 15, fontWeight: 'bold', fontFamily: 'Tajawal' }}>
                  Liste des commandes (20 premières):
                </Text>
                {orders.slice(0, 20).map((order, index) => (
                  <Text key={order.id || index} style={{ marginBottom: 5, fontSize: 10 }}>
                    #{order.id || 'N/A'} - {order.clientName || 'N/A'} - {order.status || 'PENDING'} - {formatCurrency(Number(order.remainingAmount || 0))}
                  </Text>
                ))}
                {orders.length > 20 && (
                  <Text style={{ marginTop: 10, fontSize: 10, color: '#666', fontFamily: 'Tajawal' }}>
                    ... et {orders.length - 20} commandes supplémentaires
                  </Text>
                )}
              </View>
            </Page>
          </Document>
        );
        
        const fallbackBlob = await pdf(fallbackDoc).toBlob();
        const url = URL.createObjectURL(fallbackBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `external-orders-fallback-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('PDF generated with simplified format due to formatting issues.');
      } catch (fallbackError) {
        console.error('Fallback PDF generation failed:', fallbackError);
        alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isGenerating}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium rounded-lg 
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isGenerating ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <HiOutlinePrinter className="w-4 h-4" />
          {children || 'Export PDF'}
        </>
      )}
    </button>
  );
};

export default PDFExportButton;
