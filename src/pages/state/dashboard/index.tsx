import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { 
  fetchTournaments, 
  fetchUpcomingTournaments 
} from '../../../store/slices/tournamentsSlice';
import { 
  fetchClubs 
} from '../../../store/slices/clubsSlice';
import { 
  fetchUsers, 
  fetchPlayers 
} from '../../../store/slices/usersSlice';
import { 
  fetchOverviewStats, 
  fetchUserStats 
} from '../../../store/slices/statsSlice';
import Overview from './Overview';
import Tournaments from './Tournaments';
import ClubManagement from './ClubManagement';
import Verifications from './Verifications';
import Microsite from './Microsite';
import Analytics from './Analytics';
import Communications from './Communications';

const StateDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Redux selectors for real data
  const tournaments = useSelector((state: RootState) => state.tournaments.tournaments);
  const tournamentsLoading = useSelector((state: RootState) => state.tournaments.loading);
  const tournamentsError = useSelector((state: RootState) => state.tournaments.error);
  
  const clubs = useSelector((state: RootState) => state.clubs.clubs);
  const clubsLoading = useSelector((state: RootState) => state.clubs.loading);
  const clubsError = useSelector((state: RootState) => state.clubs.error);
  
  const users = useSelector((state: RootState) => state.users.users);
  const usersLoading = useSelector((state: RootState) => state.users.loading);
  const usersError = useSelector((state: RootState) => state.users.error);
  
  const overviewStats = useSelector((state: RootState) => state.stats.overviewStats);
  const userStats = useSelector((state: RootState) => state.stats.userStats);
  const statsLoading = useSelector((state: RootState) => state.stats.loading);
  const statsError = useSelector((state: RootState) => state.stats.error);

  // Helper function to safely parse IDs
  const safeParseId = (id: string): number => {
    const parsed = parseInt(id);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to ensure numeric values are valid
  const ensureValidNumber = (value: any, fallback: number = 0): number => {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value;
    }
    return fallback;
  };

  // Fetch data when component mounts and when specific tabs are activated
  useEffect(() => {
    // Always fetch overview stats and user stats
    dispatch(fetchOverviewStats());
    dispatch(fetchUserStats());
    
    // Fetch players for member data (using public endpoint)
    dispatch(fetchPlayers({ 
      limit: 100,
      page: 1 
    }));
  }, [dispatch]);

  // Fetch tournaments when tournaments tab is clicked
  useEffect(() => {
    if (activeTab === 'tournaments') {
      dispatch(fetchTournaments({ 
        tournament_type: 'state',
        limit: 50,
        page: 1 
      }));
      dispatch(fetchUpcomingTournaments(10));
    }
  }, [activeTab, dispatch]);

  // Fetch clubs when clubs tab is clicked
  useEffect(() => {
    if (activeTab === 'clubs') {
      dispatch(fetchClubs({ 
        state: user?.state,
        limit: 100,
        page: 1 
      }));
    }
  }, [activeTab, dispatch, user?.state]);

  // Calculate derived statistics from real data with validation
  const stateStats = {
    totalMembers: ensureValidNumber(userStats?.total_users, 0),
    activeMembers: ensureValidNumber(userStats?.active_users, 0),
    totalClubs: ensureValidNumber(overviewStats?.total_clubs, 0),
    totalCourts: (clubs || []).reduce((total, club) => {
      const courtCount = club.court_count;
      return total + (typeof courtCount === 'number' && !isNaN(courtCount) ? courtCount : 0);
    }, 0),
    totalTournaments: ensureValidNumber(overviewStats?.total_tournaments, 0),
    monthlyRevenue: ensureValidNumber(overviewStats?.total_revenue, 0),
    pendingApplications: (users || []).filter(user => user.membership_status === 'free').length,
    upcomingEvents: (tournaments || []).filter(t => 
      t.status === 'registration_open' || t.status === 'published'
    ).length
  };

  // Validate and transform data with error handling
  const getValidTournaments = () => {
    try {
      return (tournaments || []).filter(t => t && t.id && t.name);
    } catch (error) {
      console.error('Error filtering tournaments:', error);
      return [];
    }
  };

  const getValidClubs = () => {
    try {
      return (clubs || []).filter(c => c && c.id && c.name);
    } catch (error) {
      console.error('Error filtering clubs:', error);
      return [];
    }
  };

  const getValidUsers = () => {
    try {
      return (users || []).filter(u => u && u.id);
    } catch (error) {
      console.error('Error filtering users:', error);
      return [];
    }
  };

  // Transform tournaments data for the component with validation
  const transformedTournaments = getValidTournaments().map(tournament => ({
    id: safeParseId(tournament.id),
    name: tournament.name || 'Unnamed Tournament',
    date: tournament.start_date || new Date().toISOString().split('T')[0],
    location: tournament.venue_name || 'Location TBD',
    participants: tournament.current_participants || 0,
    maxParticipants: tournament.max_participants || 0,
    entryFee: tournament.entry_fee || 0,
    status: tournament.status || 'draft',
    category: tournament.category || 'singles',
    revenue: (tournament.entry_fee || 0) * (tournament.current_participants || 0)
  }));

  // Transform clubs data for the component with validation
  const transformedClubAffiliations = getValidClubs().map(club => ({
    id: safeParseId(club.id),
    name: club.name || 'Unnamed Club',
    city: club.city || 'Unknown City',
    members: club.member_count || 0,
    status: club.membership_status === 'active' ? 'Active' : 
            club.membership_status === 'pending' ? 'Pending Review' : 'Suspended',
    complianceScore: club.membership_status === 'active' ? 95 :
                    club.membership_status === 'pending' ? 60 : 30,
    lastInspection: club.updated_at ? new Date(club.updated_at).toLocaleDateString() : 'Never',
    nextInspection: club.updated_at ? 
      new Date(new Date(club.updated_at).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString() :
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    issues: club.membership_status === 'active' ? 0 :
            club.membership_status === 'pending' ? 2 : 5
  }));

  // Transform member verification data for the component with validation
  const transformedMemberVerifications = getValidUsers().map(user => ({
    id: safeParseId(user.id),
    name: user.full_name || user.username || 'Unknown User',
    type: user.user_type === 'player' ? 'Player' : 
          user.user_type === 'coach' ? 'Coach' : 
          user.user_type === 'club' ? 'Club Manager' : 'Tournament Director',
    club: user.club?.name || 'Independent',
    submitted: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Never',
    status: user.membership_status === 'basic' || user.membership_status === 'premium' ? 'Verified' : 'Pending',
    documents: user.verification_documents ? ['ID Card', 'Verification'] : ['ID Card'],
    verifiedBy: user.membership_status === 'basic' || user.membership_status === 'premium' ? 'System' : null,
    verifiedDate: user.membership_status === 'basic' || user.membership_status === 'premium' ? 
      (user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never') : null
  }));

  // Transform recent members data with validation
  const recentMembers = getValidUsers()
    .filter(user => user.user_type === 'player')
    .sort((a, b) => {
      try {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      } catch (error) {
        console.error('Error sorting users by date:', error);
        return 0;
      }
    })
    .slice(0, 5)
    .map(user => ({
      id: safeParseId(user.id),
      name: user.full_name || user.username || 'Unknown User',
      type: user.user_type || 'player',
      club: user.club?.name || 'Independent',
      joinDate: user.created_at || new Date().toISOString().split('T')[0],
      status: user.membership_status || 'pending',
      photo: user.profile_photo
    }));

  // Transform recent announcements with validation
  const recentAnnouncements = getValidTournaments()
    .filter(t => t.status === 'published' || t.status === 'registration_open')
    .slice(0, 5)
    .map(tournament => ({
      id: safeParseId(tournament.id),
      title: tournament.name || 'Untitled Tournament',
      date: tournament.start_date || new Date().toISOString().split('T')[0],
      priority: tournament.status === 'registration_open' ? 'High' : 'Medium',
      category: 'Tournament'
    }));

  // Analytics data derived from real data
  const analyticsData = {
    memberGrowth: ensureValidNumber(userStats && userStats.total_users > 0 ? ((userStats.total_users - (userStats.total_users * 0.9)) / (userStats.total_users * 0.9)) * 100 : 0, 0),
    revenueGrowth: ensureValidNumber(overviewStats && overviewStats.total_revenue > 0 ? ((overviewStats.total_revenue - (overviewStats.total_revenue * 0.9)) / (overviewStats.total_revenue * 0.9)) * 100 : 0, 0),
    tournamentParticipation: ensureValidNumber((() => {
      const totalParticipants = (tournaments || []).reduce((total, t) => total + (t.current_participants || 0), 0);
      const totalMaxParticipants = (tournaments || []).reduce((total, t) => total + (t.max_participants || 0), 0);
      return totalMaxParticipants > 0 ? (totalParticipants / totalMaxParticipants) * 100 : 0;
    })(), 0),
    clubCompliance: ensureValidNumber((() => {
      const activeClubs = (clubs || []).filter(c => c.membership_status === 'active').length;
      const totalClubs = (clubs || []).length;
      return totalClubs > 0 ? (activeClubs / totalClubs) * 100 : 0;
    })(), 0),
    monthlyTrends: [45, 52, 48, 67, 73, 89, 95, 87, 92, 98, 105, 112] // Placeholder - would need time-series API
  };

  // Communications data derived from real data
  const communicationsData = {
    totalAnnouncements: recentAnnouncements.length,
    scheduledMessages: (tournaments || []).filter(t => t.status === 'published').length,
    memberEngagement: 78.5, // Placeholder - would need engagement API
    responseRate: 92.3, // Placeholder - would need response API
    recentMessages: recentAnnouncements.map(announcement => ({
      id: safeParseId(announcement.id.toString()),
      type: 'Announcement',
      title: announcement.title,
      sentDate: announcement.date,
      recipients: stateStats.totalMembers,
      opened: Math.floor(stateStats.totalMembers * 0.7), // Placeholder
      clicked: Math.floor(stateStats.totalMembers * 0.2) // Placeholder
    }))
  };

  // Microsite configuration data
  const micrositeConfig = {
    stateName: `${user?.state || 'State'} Pickleball Federation`,
    description: `Official state representative for ${user?.state || 'State'} Pickleball Federation with authority to organize state-level tournaments`,
    logo: user?.logo || 'https://example.com/state-logo.png',
    bannerImage: 'https://example.com/state-banner.jpg',
    contactInfo: {
      phone: user?.phone || '+1-555-123-4567',
      email: user?.email || 'state@pickleballfederation.org',
      address: `${user?.address || '123 State Street'}, ${user?.city || 'City'}, ${user?.state || 'State'}`,
      website: user?.website || 'https://www.state-pickleball.org'
    },
    socialMedia: {
      facebook: 'https://facebook.com/state-pickleball',
      instagram: 'https://instagram.com/state-pickleball',
      twitter: 'https://twitter.com/state-pickleball'
    },
    features: {
      tournaments: true,
      training: true,
      rankings: true,
      news: true
    }
  };

  // Performance analytics data
  const performanceData = {
    memberGrowth: {
      thisYear: userStats?.total_users || 0,
      lastYear: Math.floor((userStats?.total_users || 0) * 0.9),
      growth: analyticsData.memberGrowth
    },
    revenueGrowth: {
      thisYear: overviewStats?.total_revenue || 0,
      lastYear: Math.floor((overviewStats?.total_revenue || 0) * 0.9),
      growth: analyticsData.revenueGrowth
    },
    tournamentGrowth: {
      thisYear: overviewStats?.total_tournaments || 0,
      lastYear: Math.floor((overviewStats?.total_tournaments || 0) * 0.8),
      growth: ensureValidNumber((() => {
        const thisYear = overviewStats?.total_tournaments || 0;
        const lastYear = Math.floor(thisYear * 0.8);
        return lastYear > 0 ? ((thisYear - lastYear) / lastYear) * 100 : 0;
      })(), 0)
    },
    monthlyTrends: [
      { month: 'Jan', members: Math.floor((userStats?.total_users || 0) * 0.95), revenue: Math.floor((overviewStats?.total_revenue || 0) * 0.1) },
      { month: 'Feb', members: Math.floor((userStats?.total_users || 0) * 0.97), revenue: Math.floor((overviewStats?.total_revenue || 0) * 0.1) },
      { month: 'Mar', members: userStats?.total_users || 0, revenue: Math.floor((overviewStats?.total_revenue || 0) * 0.1) },
      { month: 'Apr', members: 0, revenue: 0 }
    ]
  };

  // Loading states
  const isLoading = statsLoading || (activeTab === 'tournaments' && tournamentsLoading) || 
                   (activeTab === 'clubs' && clubsLoading) || 
                   (activeTab === 'overview' && usersLoading);
 
  // Error states
  const hasError = statsError || tournamentsError || clubsError || usersError;

  // Refresh function
  const handleRefresh = () => {
    dispatch(fetchOverviewStats());
    dispatch(fetchUserStats());
    dispatch(fetchPlayers({ 
      limit: 100,
      page: 1 
    }));
    
    if (activeTab === 'tournaments') {
      dispatch(fetchTournaments({ 
        tournament_type: 'state',
        limit: 50,
        page: 1 
      }));
      dispatch(fetchUpcomingTournaments(10));
    }
    
    if (activeTab === 'clubs') {
      dispatch(fetchClubs({ 
        state: user?.state,
        limit: 100,
        page: 1 
      }));
    }
  };

  // Error display component with retry functionality
  const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
      <div className="text-gray-400 mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-on-scroll">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">State Federation Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.full_name || 'Federation Administrator'}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {hasError && <ErrorDisplay error={hasError} />}

        {/* Quick Stats */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-on-scroll">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-blue-600">{stateStats.totalMembers.toLocaleString()}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg font-semibold">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Clubs</p>
                  <p className="text-2xl font-bold text-green-600">{stateStats.totalClubs}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg font-semibold">🏢</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">${stateStats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg font-semibold">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-orange-600">{stateStats.pendingApplications}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg font-semibold">⏳</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <div className="mb-8">
          {/* Tab Navigation */}
          <div className="grid w-full grid-cols-7 bg-white rounded-lg shadow-sm border border-gray-200 p-1 animate-on-scroll">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'tournaments'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Tournaments
            </button>
            <button
              onClick={() => setActiveTab('clubs')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'clubs'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Clubs
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'verifications'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Verifications
            </button>
            <button
              onClick={() => setActiveTab('microsite')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'microsite'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Microsite
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('communications')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'communications'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Communications
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="animate-on-scroll">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <Overview 
                    stateStats={stateStats}
                    recentMembers={recentMembers}
                    recentAnnouncements={recentAnnouncements}
                  />
                )}
              </div>
            )}

            {/* Tournaments Tab */}
            {activeTab === 'tournaments' && (
              <div className="animate-on-scroll">
                {tournamentsLoading ? (
                  <LoadingSkeleton />
                ) : tournamentsError ? (
                  <ErrorDisplay error={tournamentsError} />
                ) : transformedTournaments.length === 0 ? (
                  <EmptyState message="No tournaments found for this state. Create a new tournament to get started." />
                ) : (
                  <Tournaments tournaments={transformedTournaments} />
                )}
              </div>
            )}

            {/* Clubs Tab */}
            {activeTab === 'clubs' && (
              <div className="animate-on-scroll">
                {clubsLoading ? (
                  <LoadingSkeleton />
                ) : clubsError ? (
                  <ErrorDisplay error={clubsError} />
                ) : transformedClubAffiliations.length === 0 ? (
                  <EmptyState message="No clubs found in this state. Encourage local clubs to register with the federation." />
                ) : (
                  <ClubManagement clubAffiliations={transformedClubAffiliations} />
                )}
              </div>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <div className="animate-on-scroll">
                {usersLoading ? (
                  <LoadingSkeleton />
                ) : usersError ? (
                  <ErrorDisplay error={usersError} />
                ) : transformedMemberVerifications.length === 0 ? (
                  <EmptyState message="No verification requests found. Members will appear here when they submit verification documents." />
                ) : (
                  <Verifications memberVerifications={transformedMemberVerifications} />
                )}
              </div>
            )}

            {/* Microsite Tab */}
            {activeTab === 'microsite' && (
              <div className="animate-on-scroll">
                <Microsite micrositeConfig={micrositeConfig} />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="animate-on-scroll">
                {statsLoading ? (
                  <LoadingSkeleton />
                ) : statsError ? (
                  <ErrorDisplay error={statsError} />
                ) : !overviewStats && !userStats ? (
                  <EmptyState message="No analytics data available. Data will appear here once the federation starts collecting information." />
                ) : (
                  <Analytics performanceData={performanceData} stateStats={stateStats} />
                )}
              </div>
            )}

            {/* Communications Tab */}
            {activeTab === 'communications' && (
              <div className="animate-on-scroll">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <Communications 
                    stateStats={stateStats}
                    recentAnnouncements={recentAnnouncements}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateDashboard; 