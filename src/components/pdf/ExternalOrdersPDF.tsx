import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register Tajawal Arabic font for proper Arabic text rendering
try {
  Font.register({
    family: 'Tajawal',
    fonts: [
      {
        src: '/fonts/Tajawal/Tajawal-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: '/fonts/Tajawal/Tajawal-Medium.ttf',
        fontWeight: 500,
      },
      {
        src: '/fonts/Tajawal/Tajawal-Bold.ttf',
        fontWeight: 'bold',
      },
      {
        src: '/fonts/Tajawal/Tajawal-ExtraBold.ttf',
        fontWeight: 800,
      },
    ],
  });
} catch (error) {
  console.warn('Failed to register Tajawal font:', error);
}

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontSize: 10,
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyNameArabic: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'Tajawal',
  },
  companyNameFrench: {
    fontSize: 14,
    color: '#e0e7ff',
    marginBottom: 2,
  },
  companySubtitle: {
    fontSize: 10,
    color: '#c7d2fe',
  },
  reportInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#e0e7ff',
    marginBottom: 3,
  },
  reportDate: {
    fontSize: 10,
    color: '#c7d2fe',
  },
  content: {
    padding: 30,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  summaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: '#374151',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusPending: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  statusValidated: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statusTransit: {
    backgroundColor: '#DBEAFE',
    color: '#2563EB',
  },
  statusReady: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  statusDelivered: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pageNumber: {
    fontSize: 10,
    color: '#6B7280',
  },
  generatedBy: {
    fontSize: 10,
    color: '#6B7280',
  },
});

interface GlassesOrder {
  id: number;
  optic: {
    id: number;
    opticName: string;
    firstName: string;
    lastName: string;
    tel: string;
  } | null;
  status: "PENDING" | "VALIDATED" | "TRANSIT" | "READY_TO_PICKUP" | "DELIVERED";
  validatedAt: string | null;
  clientName: string;
  clientTel: string;
  rightSphere: string;
  rightCylinder: string;
  rightAxis: number;
  rightAddition: string;
  leftSphere: string;
  leftCylinder: string;
  leftAxis: number;
  leftAddition: string;
  category: {
    id: number;
    name: string;
    arabicName: string;
    isExpensive: boolean;
    amount: number;
    prepayAmount: number | null;
    hasAdd: boolean;
  };
  factureId: number | null;
  paymentStatus: "PAID" | "PARTIAL_PAID" | "UNPAID";
  paidAmount: number | null;
  remainingAmount: number;
  createdAt: string;
  rightEye: boolean;
  leftEye: boolean;
  totalPrice?: number | null;
}

interface ExternalOrdersPDFProps {
  orders: GlassesOrder[];
  filter?: string;
  paymentFilter?: string;
  opticFilter?: string | null;
}

const ExternalOrdersPDF: React.FC<ExternalOrdersPDFProps> = ({
  orders,
  filter = "ALL",
  paymentFilter = "ALL",
  opticFilter = null
}) => {
  // Filter orders based on current filters and limit to first 20
  const filteredOrders = orders.filter((order) => {
    if (filter !== "ALL" && order.status !== filter) return false;
    if (paymentFilter !== "ALL" && order.paymentStatus !== paymentFilter) return false;
    if (opticFilter !== null) {
      if (opticFilter === "null") {
        if (order.optic !== null) return false;
      } else {
        if (!order.optic || order.optic.id !== Number(opticFilter)) return false;
      }
    }
    return true;
  }).slice(0, 20); // Limit to first 20 orders

  // Calculate summary statistics
  const allFilteredOrders = orders.filter((order) => {
    if (filter !== "ALL" && order.status !== filter) return false;
    if (paymentFilter !== "ALL" && order.paymentStatus !== paymentFilter) return false;
    if (opticFilter !== null) {
      if (opticFilter === "null") {
        if (order.optic !== null) return false;
      } else {
        if (!order.optic || order.optic.id !== Number(opticFilter)) return false;
      }
    }
    return true;
  });

  const displayedOrders = filteredOrders.length;
  const totalOrders = allFilteredOrders.length;
  const pendingOrders = filteredOrders.filter(order => order.status === "PENDING").length;
  const deliveredOrders = filteredOrders.filter(order => order.status === "DELIVERED").length;
  const totalRemaining = filteredOrders.reduce((total, order) => total + order.remainingAmount, 0);

  // Get status badge style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return [styles.statusBadge, styles.statusPending];
      case "VALIDATED":
        return [styles.statusBadge, styles.statusValidated];
      case "TRANSIT":
        return [styles.statusBadge, styles.statusTransit];
      case "READY_TO_PICKUP":
        return [styles.statusBadge, styles.statusReady];
      case "DELIVERED":
        return [styles.statusBadge, styles.statusDelivered];
      default:
        return [styles.statusBadge, styles.statusPending];
    }
  };


  // Format currency with error handling
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

  // Format date with error handling
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoSection}>
              <Image
                style={styles.logo}
                src="/images/logo/al_amana_logo.webp"
              />
              <View style={styles.companyInfo}>
                <Text style={styles.companyNameArabic}>
                  الأمانة البصريات
                </Text>
                <Text style={styles.companyNameFrench}>
                  Essafwa Optique
                </Text>
                <Text style={styles.companySubtitle}>
                  Centre d'Optique Professionnel
                </Text>
              </View>
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>
                Rapport des Commandes Externes
              </Text>
              <Text style={styles.reportSubtitle}>
                External Orders Report
              </Text>
              <Text style={styles.reportDate}>
                Généré le: {new Date().toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>

          {/* Modern Summary */}
          <View style={{
            marginBottom: 20,
            padding: 15,
            backgroundColor: '#f8fafc',
            border: '1 solid #e2e8f0',
            borderRadius: 8
          }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1e40af', fontFamily: 'Tajawal' }}>
              Résumé des Commandes / Orders Summary
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Tajawal' }}>
                Commandes affichées: {displayedOrders} sur {totalOrders}
              </Text>
              <Text style={{ fontSize: 11, color: '#374151' }}>
                Displayed Orders: {displayedOrders} of {totalOrders}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Tajawal' }}>
                En attente: {pendingOrders} | Livrées: {deliveredOrders}
              </Text>
              <Text style={{ fontSize: 11, color: '#374151' }}>
                Pending: {pendingOrders} | Delivered: {deliveredOrders}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc2626', fontFamily: 'Tajawal' }}>
                Montant restant: {formatCurrency(totalRemaining)}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc2626' }}>
                Remaining Amount: {formatCurrency(totalRemaining)}
              </Text>
            </View>
          </View>

          {/* Note about limited results */}
          {totalOrders > 20 && (
            <View style={{ marginBottom: 15, padding: 10, backgroundColor: '#fef3c7', border: '1 solid #f59e0b', borderRadius: 5 }}>
              <Text style={{ fontSize: 9, color: '#92400e', textAlign: 'center', marginBottom: 3, fontFamily: 'Tajawal' }}>
                Note: Affichage des 20 premières commandes sur {totalOrders} commandes au total.
              </Text>
              <Text style={{ fontSize: 9, color: '#92400e', textAlign: 'center' }}>
                Note: Showing first 20 orders out of {totalOrders} total orders.
              </Text>
            </View>
          )}

        {/* Simple Table */}
        <View>
          {/* Table Header */}
          <View style={{ flexDirection: 'row', backgroundColor: '#1e40af', padding: 8, marginBottom: 2 }}>
            <Text style={{ flex: 1, fontSize: 8, fontWeight: 'bold', color: '#ffffff' }}>ID</Text>
            <Text style={{ flex: 2, fontSize: 8, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Tajawal' }}>Client / عميل</Text>
            <Text style={{ flex: 1.5, fontSize: 8, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Tajawal' }}>Phone / هاتف</Text>
            <Text style={{ flex: 2, fontSize: 8, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Tajawal' }}>Opticien / بصريات</Text>
            <Text style={{ flex: 1.5, fontSize: 8, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Tajawal' }}>Status / حالة</Text>
            <Text style={{ flex: 1.5, fontSize: 8, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Tajawal' }}>Payment / دفع</Text>
            <Text style={{ flex: 1.5, fontSize: 8, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Tajawal' }}>Amount / مبلغ</Text>
            <Text style={{ flex: 1.5, fontSize: 8, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Tajawal' }}>Remaining / باقي</Text>
            <Text style={{ flex: 1, fontSize: 8, fontWeight: 'bold', color: '#ffffff' }}>Date</Text>
          </View>

          {/* Table Rows */}
          {filteredOrders.length === 0 ? (
            <View style={{ padding: 20, textAlign: 'center' }}>
              <Text style={{ fontSize: 10 }}>
                No orders found matching the current filters.
              </Text>
            </View>
          ) : (
            filteredOrders.map((order, index) => (
              <View key={order.id || index} style={{
                flexDirection: 'row',
                padding: 5,
                marginBottom: 1,
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
              }}>
                <Text style={{ flex: 1, fontSize: 7 }}>
                  #{order.id || 'N/A'}
                  {order.factureId ? ` (F:${order.factureId})` : ''}
                </Text>
                <Text style={{ flex: 2, fontSize: 7 }}>
                  {order.clientName || 'N/A'}
                </Text>
                <Text style={{ flex: 1.5, fontSize: 7 }}>
                  {order.clientTel || 'N/A'}
                </Text>
                <Text style={{ flex: 2, fontSize: 7 }}>
                  {order.optic?.opticName || 'N/A'}
                </Text>
                <Text style={{ flex: 1.5, fontSize: 7 }}>
                  {(order.status || 'PENDING').replace('_', ' ')}
                </Text>
                <Text style={{ flex: 1.5, fontSize: 7 }}>
                  {(order.paymentStatus || 'UNPAID').replace('_', ' ')}
                </Text>
                <Text style={{ flex: 1.5, fontSize: 7 }}>
                  {order.totalPrice ? formatCurrency(Number(order.totalPrice)) : 'N/A'}
                </Text>
                <Text style={{ flex: 1.5, fontSize: 7 }}>
                  {formatCurrency(Number(order.remainingAmount || 0))}
                </Text>
                <Text style={{ flex: 1, fontSize: 7 }}>
                  {formatDate(order.createdAt || '')}
                </Text>
              </View>
            ))
          )}
        </View>

          {/* Simple Footer */}
          <View style={{ marginTop: 30, paddingTop: 10, borderTop: '1 solid #dee2e6', textAlign: 'center' }}>
            <Text style={{ fontSize: 8, color: '#6c757d' }}>
              Généré par le Système d'Administration Essafwa
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ExternalOrdersPDF;
