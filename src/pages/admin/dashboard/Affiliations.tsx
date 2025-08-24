import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import {
  fetchAffiliations,
  fetchAffiliationStats,
  exportAffiliationsReport,
  approveAffiliation,
  rejectAffiliation,
  suspendAffiliation,
  reactivateAffiliation,
  setSelectedAffiliation,
  clearSelectedAffiliation,
  Affiliation
} from '../../../store/slices/affiliationsSlice';

const Affiliations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { affiliations, selectedAffiliation, loading, error, stats: reduxStats } = useSelector((state: RootState) => state.affiliations);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchAffiliations({}));
    dispatch(fetchAffiliationStats());
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'club': return 'bg-purple-100 text-purple-800';
      case 'state': return 'bg-blue-100 text-blue-800';
      case 'partner': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'pending': return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'suspended': return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'expired': return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      default: return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleAffiliationAction = (affiliationId: string, action: string) => {
    switch (action) {
      case 'approve':
        dispatch(approveAffiliation({ id: affiliationId, notes: 'Approved by admin' }));
        break;
      case 'reject':
        dispatch(rejectAffiliation({ id: affiliationId, notes: 'Rejected by admin' }));
        break;
      case 'suspend':
        dispatch(suspendAffiliation({ id: affiliationId, reason: 'Suspended by admin' }));
        break;
      case 'reactivate':
        dispatch(reactivateAffiliation({ id: affiliationId, notes: 'Reactivated by admin' }));
        break;
      default:
        console.log(`Affiliation ${action} for ID ${affiliationId}`);
    }
  };

  const generateReport = () => {
    dispatch(exportAffiliationsReport({ format: 'csv' }));
  };

  const filteredAffiliations = affiliations.filter(affiliation => {
    const matchesSearch = affiliation.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         affiliation.contact_person.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || affiliation.entity_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || affiliation.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || affiliation.region === regionFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesRegion;
  });

  // Use Redux stats or calculate from local data
  const displayStats = reduxStats || {
    total: affiliations.length,
    active: affiliations.filter(a => a.status === 'active').length,
    pending: affiliations.filter(a => a.status === 'pending').length,
    suspended: affiliations.filter(a => a.status === 'suspended').length,
    total_members: affiliations.reduce((sum, a) => sum + a.member_count, 0),
    average_compliance: affiliations.reduce((sum, a) => sum + a.compliance_score, 0) / affiliations.length
  };

  const regions = Array.from(new Set(affiliations.map(a => a.region)));

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 animate-on-scroll">Affiliations Management</h2>
          <p className="text-gray-600 animate-on-scroll">Manage club, state, and partner affiliations across the platform</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={generateReport} 
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 animate-on-scroll">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-on-scroll">Total Affiliations</p>
              <div className="text-2xl font-bold text-blue-600 animate-on-scroll">{displayStats.total}</div>
              <p className="text-xs text-gray-600 animate-on-scroll">registered entities</p>
            </div>
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 animate-on-scroll">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 animate-on-scroll">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-on-scroll">Active</p>
              <div className="text-2xl font-bold text-green-600 animate-on-scroll">{displayStats.active}</div>
              <p className="text-xs text-gray-600 animate-on-scroll">current members</p>
            </div>
            <div className="p-2 rounded-full bg-green-100 text-green-600 animate-on-scroll">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 animate-on-scroll">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-on-scroll">Pending</p>
              <div className="text-2xl font-bold text-yellow-600 animate-on-scroll">{displayStats.pending}</div>
              <p className="text-xs text-gray-600 animate-on-scroll">awaiting approval</p>
            </div>
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 animate-on-scroll">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 animate-on-scroll">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-on-scroll">Suspended</p>
              <div className="text-2xl font-bold text-red-600 animate-on-scroll">{displayStats.suspended}</div>
              <p className="text-xs text-gray-600 animate-on-scroll">temporarily suspended</p>
            </div>
            <div className="p-2 rounded-full bg-red-100 text-red-600 animate-on-scroll">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 animate-on-scroll">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-on-scroll">Total Members</p>
              <div className="text-2xl font-bold text-purple-600 animate-on-scroll">{displayStats.total_members.toLocaleString()}</div>
              <p className="text-xs text-gray-600 animate-on-scroll">across all entities</p>
            </div>
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 animate-on-scroll">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 animate-on-scroll">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-on-scroll">Avg. Compliance</p>
              <div className="text-2xl font-bold text-orange-600 animate-on-scroll">{displayStats.average_compliance.toFixed(1)}%</div>
              <p className="text-xs text-gray-600 animate-on-scroll">compliance score</p>
            </div>
            <div className="p-2 rounded-full bg-orange-100 text-orange-600 animate-on-scroll">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm animate-on-scroll">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2 animate-on-scroll">Search Affiliations</label>
              <div className="relative">
                <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name or contact person..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent animate-on-scroll"
                />
              </div>
            </div>
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-2 animate-on-scroll">Type Filter</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent animate-on-scroll"
              >
                <option value="all">All Types</option>
                <option value="club">Clubs</option>
                <option value="state">State Committees</option>
                <option value="partner">Partners</option>
              </select>
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2 animate-on-scroll">Status Filter</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent animate-on-scroll"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label htmlFor="regionFilter" className="block text-sm font-medium text-gray-700 mb-2 animate-on-scroll">Region Filter</label>
              <select 
                value={regionFilter} 
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent animate-on-scroll"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliations Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm animate-on-scroll">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 animate-on-scroll">All Affiliations</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 animate-on-scroll">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Entity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Region</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Members</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Compliance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Renewal Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 animate-on-scroll">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffiliations.map((affiliation) => (
                  <tr key={affiliation.id} className="border-b border-gray-100 hover:bg-gray-50 animate-on-scroll">
                    <td className="py-3 px-4 font-medium animate-on-scroll">
                      <div>
                        <div className="animate-on-scroll">{affiliation.entity_name}</div>
                        <div className="text-sm text-gray-500 animate-on-scroll">{affiliation.contact_person}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(affiliation.entity_type)} animate-on-scroll`}>
                        <div className="flex items-center space-x-1">
                          {affiliation.entity_type === 'club' && (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                          {affiliation.entity_type === 'state' && (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                          {affiliation.entity_type === 'partner' && (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                          <span className="capitalize animate-on-scroll">{affiliation.entity_type}</span>
                        </div>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(affiliation.status)} animate-on-scroll`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(affiliation.status)}
                          <span className="capitalize animate-on-scroll">{affiliation.status}</span>
                        </div>
                      </span>
                    </td>
                    <td className="py-3 px-4 animate-on-scroll">{affiliation.region}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2 animate-on-scroll">
                        <span className="font-medium animate-on-scroll">{affiliation.member_count.toLocaleString()}</span>
                        {affiliation.member_count > 100 && (
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getComplianceColor(affiliation.compliance_score)} animate-on-scroll`}>
                        {affiliation.compliance_score}%
                      </span>
                    </td>
                    <td className="py-3 px-4 animate-on-scroll">{affiliation.renewal_date}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
                          onClick={() => dispatch(setSelectedAffiliation(affiliation))}
                        >
                          <svg className="h-4 w-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
                          onClick={() => handleAffiliationAction(affiliation.id, 'edit')}
                        >
                          <svg className="h-4 w-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        {affiliation.status === 'pending' && (
                          <>
                            <button
                              className="px-3 py-1 text-sm bg-white text-green-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
                              onClick={() => handleAffiliationAction(affiliation.id, 'approve')}
                            >
                              <svg className="h-4 w-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Approve
                            </button>
                            <button
                              className="px-3 py-1 text-sm bg-white text-red-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
                              onClick={() => handleAffiliationAction(affiliation.id, 'reject')}
                            >
                              <svg className="h-4 w-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Reject
                            </button>
                          </>
                        )}
                        {affiliation.status === 'suspended' && (
                          <button
                            className="px-3 py-1 text-sm bg-white text-green-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
                            onClick={() => handleAffiliationAction(affiliation.id, 'reactivate')}
                          >
                            <svg className="h-4 w-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAffiliations.length === 0 && (
            <div className="text-center py-8 animate-on-scroll">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2 animate-on-scroll">No affiliations found</h3>
              <p className="text-gray-600 animate-on-scroll">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Affiliation Detail Modal */}
      {selectedAffiliation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 animate-on-scroll">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold animate-on-scroll">Affiliation Details</h3>
              <button 
                className="p-1 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 animate-on-scroll"
                onClick={() => dispatch(clearSelectedAffiliation())}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Entity Name</label>
                  <p className="font-medium animate-on-scroll">{selectedAffiliation.entity_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Type</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedAffiliation.entity_type)} animate-on-scroll`}>
                    <span className="capitalize animate-on-scroll">{selectedAffiliation.entity_type}</span>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Status</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAffiliation.status)} animate-on-scroll`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedAffiliation.status)}
                      <span className="capitalize animate-on-scroll">{selectedAffiliation.status}</span>
                    </div>
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Region</label>
                  <p className="animate-on-scroll">{selectedAffiliation.region}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Member Count</label>
                  <p className="font-medium animate-on-scroll">{selectedAffiliation.member_count.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Compliance Score</label>
                  <p className={`font-medium ${getComplianceColor(selectedAffiliation.compliance_score)} animate-on-scroll`}>
                    {selectedAffiliation.compliance_score}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Join Date</label>
                  <p className="animate-on-scroll">{selectedAffiliation.join_date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Renewal Date</label>
                  <p className="animate-on-scroll">{selectedAffiliation.renewal_date}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Contact Person</label>
                  <p className="animate-on-scroll">{selectedAffiliation.contact_person}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 animate-on-scroll">Contact Email</label>
                  <p className="animate-on-scroll">{selectedAffiliation.contact_email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 animate-on-scroll">Last Audit</label>
                <p className="animate-on-scroll">{selectedAffiliation.last_audit}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 animate-on-scroll">Benefits</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedAffiliation.benefits.map((benefit, index) => (
                    <span key={index} className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full animate-on-scroll">{benefit}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button 
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
                onClick={() => dispatch(clearSelectedAffiliation())}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
                onClick={() => handleAffiliationAction(selectedAffiliation.id, 'edit')}
              >
                <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleAffiliationAction(selectedAffiliation.id, 'manage')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors animate-on-scroll"
              >
                <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Manage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Affiliations; 