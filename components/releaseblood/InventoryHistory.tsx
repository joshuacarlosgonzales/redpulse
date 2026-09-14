// components/inventory/InventoryHistory.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Droplet,
  Search,
  Filter,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Building,
  Stethoscope,
  FileText,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  RefreshCw
} from 'lucide-react';

interface HistoryRecord {
  id: string;
  type: 'release' | 'storage' | 'donation';
  bloodType: string;
  units: number;
  patientName?: string;
  donorName?: string;
  doctorName?: string;
  hospitalWard?: string;
  reason?: string;
  notes?: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  receiptNumber?: string;
  requestId?: string;
  location?: string;
  expiryDate?: string;
  releasedBy?: string;
}

interface InventoryHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName?: string;
  hospitalAddress?: string;
}

export default function InventoryHistory({
  isOpen,
  onClose,
  hospitalName = "Gov. Valeriano M. Gatuslao Memorial Hospital",
  hospitalAddress = "Himamaylan City, Negros Occidental"
}: InventoryHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, pagination.page, typeFilter]);

  const fetchHistory = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/hospital/inventory/history?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      setHistory(data.data || []);
      setFilteredHistory(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchHistory(false);
  };

  const handleViewReceipt = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups to print the receipt.');
      return;
    }

    const styles = `
      <style>
        @media print {
          body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: white; }
          .receipt { max-width: 400px; margin: 0 auto; padding: 20px; }
          .text-center { text-align: center; }
          .border-bottom { border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
          .receipt-item { display: flex; justify-content: space-between; padding: 4px 0; }
          .receipt-item .label { font-weight: bold; color: #555; }
          .receipt-item .value { font-weight: bold; }
          .header { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          .sub-header { font-size: 12px; color: #666; margin-bottom: 16px; }
          .receipt-footer { margin-top: 20px; padding-top: 10px; border-top: 2px dashed #ccc; text-align: center; font-size: 11px; color: #888; }
        }
        @media screen {
          body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: #f5f5f5; }
          .receipt { max-width: 400px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .text-center { text-align: center; }
          .border-bottom { border-bottom: 2px dashed #e5e7eb; padding-bottom: 10px; margin-bottom: 10px; }
          .receipt-item { display: flex; justify-content: space-between; padding: 4px 0; }
          .receipt-item .label { font-weight: bold; color: #6b7280; }
          .receipt-item .value { font-weight: bold; color: #1f2937; }
          .header { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #dc2626; }
          .sub-header { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
          .receipt-footer { margin-top: 20px; padding-top: 10px; border-top: 2px dashed #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
        }
      </style>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Blood Release Receipt</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          <\/script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'release': return 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'storage': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'donation': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'release': return <ArrowUpRight className="w-3 h-3" />;
      case 'storage': return <Package className="w-3 h-3" />;
      case 'donation': return <Droplet className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
      case 'pending': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30';
      case 'cancelled': return 'text-red-600 bg-red-50 dark:bg-red-950/30';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 rounded-t-2xl">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-red-500" />
                Inventory History
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Track all blood releases, storage, and donations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-zinc-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by patient, donor, or blood type..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="all">📋 All Types</option>
                <option value="release">🔄 Releases</option>
                <option value="storage">📦 Storage</option>
                <option value="donation">🩸 Donations</option>
              </select>
              <button
                onClick={() => fetchHistory()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400">No history records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-4 hover:border-red-200 dark:hover:border-red-800/60 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getTypeColor(record.type)}`}>
                            {getTypeIcon(record.type)}
                            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                            <Droplet className="w-3 h-3" />
                            {record.bloodType}
                          </span>
                          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {record.units} unit{record.units > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {record.patientName && (
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                              <User className="w-3.5 h-3.5" />
                              <span>Patient: <span className="font-medium text-zinc-900 dark:text-white">{record.patientName}</span></span>
                            </div>
                          )}
                          {record.donorName && (
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                              <User className="w-3.5 h-3.5" />
                              <span>Donor: <span className="font-medium text-zinc-900 dark:text-white">{record.donorName}</span></span>
                            </div>
                          )}
                          {record.doctorName && (
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Doctor: <span className="font-medium text-zinc-900 dark:text-white">{record.doctorName}</span></span>
                            </div>
                          )}
                          {record.hospitalWard && (
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                              <Building className="w-3.5 h-3.5" />
                              <span>Ward: <span className="font-medium text-zinc-900 dark:text-white">{record.hospitalWard}</span></span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(record.date)}</span>
                          </div>
                          {record.receiptNumber && (
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="font-mono text-xs">Receipt: {record.receiptNumber}</span>
                            </div>
                          )}
                        </div>
                        {record.reason && (
                          <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="font-medium">Reason:</span> {record.reason}
                          </div>
                        )}
                        {record.notes && (
                          <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                            {record.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {(record.type === 'release' || record.type === 'donation') && (
                          <button
                            onClick={() => handleViewReceipt(record)}
                            className="p-2 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredHistory.length > 0 && (
            <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{filteredHistory.length}</span> of{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> records
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                          pagination.page === pageNum
                            ? 'text-white bg-red-600 hover:bg-red-700 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 5 && <span className="px-2 text-zinc-400">...</span>}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Receipt Details
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6">
              <div id="receipt-content">
                <div className="receipt">
                  <div className="text-center border-bottom" style={{ borderBottom: '2px dashed #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div className="header" style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px', color: '#dc2626' }}>
                      🩸 BLOOD RELEASE RECEIPT
                    </div>
                    <div className="sub-header" style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>{hospitalName}</div>
                    <div className="sub-header" style={{ fontSize: '10px', color: '#6b7280' }}>{hospitalAddress}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      Receipt #{selectedRecord.receiptNumber || 'N/A'}
                    </div>
                  </div>

                  <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Blood Type</span>
                    <span className="value" style={{ fontWeight: 'bold', color: '#dc2626' }}>{selectedRecord.bloodType}</span>
                  </div>
                  <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Units</span>
                    <span className="value" style={{ fontWeight: 'bold', color: '#1f2937' }}>{selectedRecord.units}</span>
                  </div>
                  {selectedRecord.patientName && (
                    <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Patient Name</span>
                      <span className="value" style={{ fontWeight: 'bold', color: '#1f2937' }}>{selectedRecord.patientName}</span>
                    </div>
                  )}
                  {selectedRecord.donorName && (
                    <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Donor Name</span>
                      <span className="value" style={{ fontWeight: 'bold', color: '#1f2937' }}>{selectedRecord.donorName}</span>
                    </div>
                  )}
                  {selectedRecord.doctorName && (
                    <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Doctor</span>
                      <span className="value" style={{ fontWeight: 'bold', color: '#1f2937' }}>{selectedRecord.doctorName}</span>
                    </div>
                  )}
                  {selectedRecord.hospitalWard && (
                    <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Ward</span>
                      <span className="value" style={{ fontWeight: 'bold', color: '#1f2937' }}>{selectedRecord.hospitalWard}</span>
                    </div>
                  )}
                  {selectedRecord.reason && (
                    <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Reason</span>
                      <span className="value" style={{ fontWeight: 'bold', color: '#1f2937' }}>{selectedRecord.reason}</span>
                    </div>
                  )}
                  <div className="receipt-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Date</span>
                    <span className="value" style={{ fontWeight: 'bold', color: '#1f2937' }}>{formatDate(selectedRecord.date)}</span>
                  </div>

                  {selectedRecord.notes && (
                    <div className="receipt-item" style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span className="label" style={{ fontWeight: 'bold', color: '#6b7280' }}>Notes</span>
                      <span className="value" style={{ fontSize: '11px', color: '#6b7280' }}>{selectedRecord.notes}</span>
                    </div>
                  )}

                  <div className="receipt-footer" style={{ marginTop: '20px', paddingTop: '10px', borderTop: '2px dashed #e5e7eb', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
                    <div>✓ This is a valid blood release receipt</div>
                    <div style={{ marginTop: '4px' }}>Generated: {new Date().toLocaleString()}</div>
                    <div style={{ marginTop: '4px', fontSize: '10px' }}>Thank you for saving lives! ❤️</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}