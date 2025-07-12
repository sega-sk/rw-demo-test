import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Calendar, Mail, Phone, User, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Modal from '../../components/UI/Modal';
import { leadsService } from '../../services/leads';
import { useApi, useMutation } from '../../hooks/useApi';
import type { Lead, LeadsListResponse } from '../../services/leads';

export default function LeadsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('-created_at');
  const itemsPerPage = 10;

  // Check if current user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You need admin privileges to access leads management.</p>
        </div>
      </div>
    );
  }

  // API hooks
  const { data: leadsData, loading, execute: refetchLeads } = useApi(
    () => leadsService.getLeads({ 
      search: searchTerm, 
      limit: itemsPerPage * 10,
      sort: sortBy 
    }),
    { 
      immediate: true,
      cacheKey: `leads-list-${searchTerm}-${sortBy}`,
      cacheTTL: 1 * 60 * 1000, // 1 minute for real-time data
      staleWhileRevalidate: true
    }
  );

  const { mutate: updateLeadStatus, loading: updating } = useMutation(
    ({ id, status }: { id: string; status: string }) => leadsService.updateLeadStatus(id, status)
  );

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetchLeads();
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, sortBy]);

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      await updateLeadStatus({ id: leadId, status: newStatus });
        navigate('/admin');
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
      alert('Failed to update lead status. Please try again.');
    }
  };

  // Get leads and apply pagination
  const allLeads = leadsData?.rows || [];
  const filteredLeads = allLeads.filter(lead =>
    lead.appendices.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.appendices.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.appendices.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.form_slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'pending':
        return 'warning';
      case 'contacted':
      case 'in_progress':
        return 'info';
      case 'completed':
      case 'closed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getFormTypeBadge = (formSlug: string) => {
    switch (formSlug) {
      case 'rent_a_product':
        return { label: 'Product Rental', variant: 'info' as const };
      case 'contact_us':
        return { label: 'Contact Us', variant: 'default' as const };
      default:
        return { label: formSlug, variant: 'default' as const };
    }
  };

  // Lead Detail Modal
  const LeadDetailModal = () => (
    <Modal
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      title="Lead Details"
      size="lg"
    >
      {selectedLead && (
        <div className="space-y-6">
          {/* Lead Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedLead.appendices.first_name} {selectedLead.appendices.last_name}
              </h3>
              <p className="text-sm text-gray-500">Lead ID: {selectedLead.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getFormTypeBadge(selectedLead.form_slug).variant}>
                {getFormTypeBadge(selectedLead.form_slug).label}
              </Badge>
              <Badge variant={getStatusBadgeVariant(selectedLead.status)}>
                {selectedLead.status}
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{selectedLead.appendices.email}</span>
                </div>
                {selectedLead.appendices.phone_number && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm">{selectedLead.appendices.phone_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Information (for rental leads) */}
            {selectedLead.form_slug === 'rent_a_product' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Rental Details</h4>
                <div className="space-y-2 text-sm">
                  {selectedLead.appendices.product_id && (
                    <div>
                      <span className="font-medium">Product ID:</span> {selectedLead.appendices.product_id}
                    </div>
                  )}
                  {selectedLead.appendices.rental_period && (
                    <div>
                      <span className="font-medium">Rental Period:</span> {selectedLead.appendices.rental_period}
                    </div>
                  )}
                  {selectedLead.appendices.start_date && (
                    <div>
                      <span className="font-medium">Start Date:</span> {selectedLead.appendices.start_date}
                    </div>
                  )}
                  {selectedLead.appendices.duration && (
                    <div>
                      <span className="font-medium">Duration:</span> {selectedLead.appendices.duration}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          {selectedLead.appendices.comments && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {selectedLead.appendices.comments}
              </p>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {['new', 'contacted', 'in_progress', 'completed', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  variant={selectedLead.status === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedLead.id, status)}
                  loading={updating}
                  className="capitalize"
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Leads Management</h1>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${filteredLeads.length} leads total`}
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="status">Status</option>
            <option value="form_slug">Form Type</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.appendices.first_name} {lead.appendices.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {lead.appendices.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getFormTypeBadge(lead.form_slug).variant} size="sm">
                      {getFormTypeBadge(lead.form_slug).label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(lead.status)} size="sm">
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Eye}
                      onClick={() => handleViewLead(lead)}
                      className="btn-hover"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeads.length === 0 && !loading && (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No leads found.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1}
                  className="btn-hover"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                  disabled={currentPage === totalPages}
                  className="btn-hover"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredLeads.length)}</span> of{' '}
                    <span className="font-medium">{filteredLeads.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-hover"
                    >
                      Previous
                    </Button>
                    {getPageNumbers().map((page) => (
                      <Button 
                        key={page}
                        variant={currentPage === page ? "primary" : "outline"}
                        size="sm" 
                        onClick={() => handlePageChange(page)}
                        className="btn-hover"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-hover"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <LeadDetailModal />
    </div>
  );
}