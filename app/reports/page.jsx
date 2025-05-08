"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, parseISO, subDays, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import FullScreenLoader from '@/components/FullScreenLoader';
import { FaDownload, FaChartLine, FaChartBar, FaChartPie, FaFilter, FaInfoCircle, FaSync } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  Filler
);

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('systemOverview');
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // Add missing activeTab state
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    groupBy: 'day',
    bankFilter: '',
    websiteFilter: '',
    userFilter: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [availableBanks, setAvailableBanks] = useState([]);
  const [availableWebsites, setAvailableWebsites] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Chart options and styles
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12 }
        }
      },
      title: {
        display: true,
        text: getReportTitle(),
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { 
                style: 'currency', 
                currency: 'INR',
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  // Set chart colors
  const colors = {
    deposit: 'rgba(75, 192, 192, 0.6)',
    withdraw: 'rgba(255, 99, 132, 0.6)',
    net: 'rgba(153, 102, 255, 0.6)',
    bank: 'rgba(54, 162, 235, 0.6)',
    website: 'rgba(255, 159, 64, 0.6)'
  };

  // Function to update filters
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Function to get report title based on type
  function getReportTitle() {
    switch (reportType) {
      case 'transactionSummary': return 'Transaction Summary Report';
      case 'balanceSummary': return 'Balance Summary Report';
      case 'userActivity': return 'User Activity Report';
      case 'trendAnalysis': return 'Transaction Trend Analysis';
      case 'systemOverview': return 'System Overview Dashboard';
      default: return 'Business Flow Report';
    }
  }

  // Fetch reference data (banks, websites, users)
  const fetchReferenceData = useCallback(async () => {
    try {
      const [banksRes, websitesRes, usersRes] = await Promise.all([
        axios.get('/api/banks?onlyNames=true'),
        axios.get('/api/websites?onlyNames=true'),
        axios.get('/api/users?onlyNames=true')
      ]);
      
      // Make sure we're setting arrays of strings, not objects
      setAvailableBanks(Array.isArray(banksRes.data.data) ? banksRes.data.data : []);
      setAvailableWebsites(Array.isArray(websitesRes.data.data) ? websitesRes.data.data : []);
      
      // For users, we need to extract usernames
      if (usersRes.data.data) {
        const usernames = Array.isArray(usersRes.data.data) 
          ? usersRes.data.data 
          : Object.keys(usersRes.data.data);
        setAvailableUsers(usernames);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
      toast.error('Failed to load filters data');
    }
  }, []);

  // Fetch report data based on selected type and filters
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/reports', {
        reportType,
        ...filters
      });
      
      if (response.data.success) {
        setReportData(response.data);
      } else {
        toast.error(response.data.error || 'Failed to generate report');
        setReportData(null);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to generate report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, filters]);

  // Reset date filters to current month
  const resetToCurrentMonth = () => {
    const today = new Date();
    setFilters(prev => ({
      ...prev,
      startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(today), 'yyyy-MM-dd')
    }));
  };

  // Export data to Excel
  const exportToExcel = useCallback(() => {
    if (!reportData || !reportData.data) {
      toast.error('No data to export');
      return;
    }

    try {
      let dataToExport;
      const fileName = `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Format data based on report type
      switch (reportType) {
        case 'transactionSummary': 
          dataToExport = reportData.data;
          break;
        case 'balanceSummary': 
          dataToExport = {
            Banks: reportData.data.banks,
            Websites: reportData.data.websites,
            Summary: [{
              totalBankBalance: reportData.data.totalBankBalance,
              totalWebsiteBalance: reportData.data.totalWebsiteBalance,
              netBalance: reportData.data.netBalance
            }]
          };
          break;
        case 'userActivity': 
          dataToExport = reportData.data.map(user => ({
            ...user,
            lastActivity: format(new Date(user.lastActivity), 'yyyy-MM-dd HH:mm'),
            firstActivity: format(new Date(user.firstActivity), 'yyyy-MM-dd HH:mm'),
            daysActive: Math.round(user.daysActive)
          }));
          break;
        case 'trendAnalysis':
          dataToExport = reportData.data;
          break;
        case 'systemOverview':
          dataToExport = {
            Counts: [reportData.data.counts],
            Balances: [reportData.data.balances],
            TransactionSummary: [reportData.data.transactions]
          };
          break;
        default:
          dataToExport = reportData.data;
      }

      // Create workbook and add worksheets
      const wb = XLSX.utils.book_new();
      
      if (reportType === 'balanceSummary') {
        // Add multiple sheets for balance summary
        XLSX.utils.book_append_sheet(
          wb, 
          XLSX.utils.json_to_sheet(dataToExport.Banks), 
          'Banks'
        );
        XLSX.utils.book_append_sheet(
          wb, 
          XLSX.utils.json_to_sheet(dataToExport.Websites), 
          'Websites'
        );
        XLSX.utils.book_append_sheet(
          wb, 
          XLSX.utils.json_to_sheet(dataToExport.Summary), 
          'Summary'
        );
      } else if (reportType === 'systemOverview') {
        // Add multiple sheets for system overview
        XLSX.utils.book_append_sheet(
          wb, 
          XLSX.utils.json_to_sheet(dataToExport.Counts), 
          'Counts'
        );
        XLSX.utils.book_append_sheet(
          wb, 
          XLSX.utils.json_to_sheet(dataToExport.Balances), 
          'Balances'
        );
        XLSX.utils.book_append_sheet(
          wb, 
          XLSX.utils.json_to_sheet(dataToExport.TransactionSummary), 
          'TransactionSummary'
        );
      } else {
        // Single sheet for other report types
        XLSX.utils.book_append_sheet(
          wb, 
          XLSX.utils.json_to_sheet(dataToExport), 
          reportType
        );
      }

      // Save file
      XLSX.writeFile(wb, fileName);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  }, [reportData, reportType]);

  // Initial data load
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // Fetch data when filters or report type changes
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Function to render the appropriate report content based on the selected report type
  const renderReportContent = () => {
    // Make sure we don't try to render data if it's not available yet
    if (!reportData || loading) {
      return <div className="flex justify-center p-10"><FiLoader className="animate-spin text-3xl text-primary" /></div>;
    }

    // Select the appropriate renderer based on report type, not activeTab
    switch (reportType) {
      case 'systemOverview':
        return renderSystemOverview();
      case 'transactionSummary':
        return renderTransactionSummary();
      case 'balanceSummary':
        return renderBalanceSummary();
      case 'userActivity':
        return renderUserActivity();
      case 'trendAnalysis':
        return renderTrendAnalysis();
      default:
        return <div className="p-6 text-center">Select a report type</div>;
    }
  };

  // Function to render system overview dashboard
  const renderSystemOverview = () => {
    if (!reportData || !reportData.data) {
      return <div className="p-6 text-center">No data available</div>;
    }

    const { data } = reportData;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">System Overview Dashboard</h2>
        
        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Total Banks</h3>
            <p className="text-2xl font-bold">{data.counts?.bankCount || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-700 mb-2">Total Websites</h3>
            <p className="text-2xl font-bold">{data.counts?.websiteCount || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-purple-700 mb-2">Total Users</h3>
            <p className="text-2xl font-bold">{data.counts?.userCount || 0}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="text-sm font-medium text-amber-700 mb-2">Total Transactions</h3>
            <p className="text-2xl font-bold">{data.counts?.transactionCount || 0}</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <h3 className="text-sm font-medium text-teal-700 mb-2">Total Accounts</h3>
            <p className="text-2xl font-bold">{data.counts?.accountCount || 0}</p>
          </div>
        </div>
        
        {/* Banks Table */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Bank Balances</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Bank Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.banks && data.banks.length > 0 ? (
                  data.banks.map((bank, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2">{bank.bank_name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {new Intl.NumberFormat('en-IN', { 
                          style: 'currency', 
                          currency: 'INR' 
                        }).format(bank.current_balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="border border-gray-300 px-4 py-2 text-center">No bank data available</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Total</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {new Intl.NumberFormat('en-IN', { 
                      style: 'currency', 
                      currency: 'INR'
                    }).format(data.balances?.totalBankBalance || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Websites Table */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Website Balances</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Website Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.websites && data.websites.length > 0 ? (
                  data.websites.map((website, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2">{website.website_name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {new Intl.NumberFormat('en-IN', { 
                          style: 'currency', 
                          currency: 'INR' 
                        }).format(website.current_balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="border border-gray-300 px-4 py-2 text-center">No website data available</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Total</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {new Intl.NumberFormat('en-IN', { 
                      style: 'currency', 
                      currency: 'INR' 
                    }).format(data.balances?.totalWebsiteBalance || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Transaction Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Transaction Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-700 mb-2">Total Deposits</h4>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat('en-IN', { 
                  style: 'currency', 
                  currency: 'INR' 
                }).format(data.transactions?.totalDeposits || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.transactions?.depositCount || 0} transactions
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="text-sm font-medium text-red-700 mb-2">Total Withdrawals</h4>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat('en-IN', { 
                  style: 'currency', 
                  currency: 'INR' 
                }).format(data.transactions?.totalWithdrawals || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.transactions?.withdrawalCount || 0} transactions
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="text-sm font-medium text-purple-700 mb-2">Net Flow</h4>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat('en-IN', { 
                  style: 'currency', 
                  currency: 'INR' 
                }).format((data.transactions?.totalDeposits || 0) - (data.transactions?.totalWithdrawals || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render transaction summary
  const renderTransactionSummary = () => {
    try {
      if (!reportData) {
        return <div className="p-6 text-center">No transaction data available</div>;
      }

      // Safely extract data with fallbacks at each level
      const reportDataObj = reportData || {};
      const rawData = reportDataObj.data || {};
      
      // Check if data is an array (direct transaction data) or nested structure
      const transactionData = Array.isArray(rawData) ? 
        rawData : 
        (rawData.transactions ? [rawData.transactions] : []);
      
      if (!transactionData || transactionData.length === 0) {
        return <div className="p-6 text-center">No transaction data available for the selected period</div>;
      }
      
      // Calculate summary values from the transaction data
      const summary = {
        totalCount: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        depositCount: 0,
        withdrawalCount: 0,
        totalAmount: 0
      };

      // Safely process transaction data
      transactionData.forEach(item => {
        if (item) {
          summary.totalCount += Number(item.count || 0);
          summary.totalDeposits += Number(item.depositAmount || item.totalDeposits || 0);
          summary.totalWithdrawals += Number(item.withdrawAmount || item.totalWithdrawals || 0);
          summary.depositCount += Number(item.depositCount || 0);
          summary.withdrawalCount += Number(item.withdrawCount || 0);
        }
      });
      
      // Calculate total amount after initial reduction
      summary.totalAmount = summary.totalDeposits + summary.totalWithdrawals;
      
      // Calculate percentages for the charts (guard against division by zero)
      const depositPercentage = summary.totalAmount > 0 
        ? (summary.totalDeposits / summary.totalAmount) * 100 
        : 0;
      
      const withdrawalPercentage = summary.totalAmount > 0 
        ? (summary.totalWithdrawals / summary.totalAmount) * 100 
        : 0;

      // Handle nested data structure (system overview format)
      const displayItems = Array.isArray(transactionData[0]) ? 
        transactionData[0] : 
        transactionData;
      
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Transaction Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transaction Stats */}
            <div>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Total Transactions</h3>
                  <p className="text-2xl font-bold">{summary.totalCount || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-700 mb-2">Total Deposit Amount</h3>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-IN', { 
                      style: 'currency', 
                      currency: 'INR' 
                    }).format(summary.totalDeposits || 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{summary.depositCount || 0} transactions</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="text-sm font-medium text-red-700 mb-2">Total Withdrawal Amount</h3>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-IN', { 
                      style: 'currency', 
                      currency: 'INR' 
                    }).format(summary.totalWithdrawals || 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{summary.withdrawalCount || 0} transactions</p>
                </div>
              </div>
            </div>
            
            {/* Transaction Chart */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Transaction Distribution</h3>
              <div className="h-52 flex items-center">
                <div className="w-full">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-green-700">Deposits</span>
                    <span className="text-sm text-green-700">
                      {depositPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div 
                      className="bg-green-500 h-4 rounded-full" 
                      style={{ width: `${depositPercentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-red-700">Withdrawals</span>
                    <span className="text-sm text-red-700">
                      {withdrawalPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div 
                      className="bg-red-500 h-4 rounded-full" 
                      style={{ width: `${withdrawalPercentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="font-medium">Net Flow: 
                      <span className={summary.totalDeposits >= summary.totalWithdrawals ? 
                        "text-green-600 ml-2" : "text-red-600 ml-2"}>
                        {new Intl.NumberFormat('en-IN', { 
                          style: 'currency', 
                          currency: 'INR' 
                        }).format((summary.totalDeposits || 0) - (summary.totalWithdrawals || 0))}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Date/Group</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Deposits</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Withdrawals</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Net Flow</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems && displayItems.length > 0 ? (
                    displayItems.map((tx, index) => {
                      const depositAmt = tx?.depositAmount || tx?.totalDeposits || 0;
                      const withdrawAmt = tx?.withdrawAmount || tx?.totalWithdrawals || 0;
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2">
                            {tx?.date || tx?.label || '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                            {new Intl.NumberFormat('en-IN', { 
                              style: 'currency', 
                              currency: 'INR' 
                            }).format(depositAmt)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-red-600">
                            {new Intl.NumberFormat('en-IN', { 
                              style: 'currency', 
                              currency: 'INR' 
                            }).format(withdrawAmt)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                            {new Intl.NumberFormat('en-IN', { 
                              style: 'currency', 
                              currency: 'INR' 
                            }).format(depositAmt - withdrawAmt)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {tx?.count || (tx.depositCount + tx.withdrawalCount) || 0}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 px-4 py-2 text-center">No transactions found</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Total</td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                      {new Intl.NumberFormat('en-IN', { 
                        style: 'currency', 
                        currency: 'INR' 
                      }).format(summary.totalDeposits || 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-red-600">
                      {new Intl.NumberFormat('en-IN', { 
                        style: 'currency', 
                        currency: 'INR' 
                      }).format(summary.totalWithdrawals || 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                      {new Intl.NumberFormat('en-IN', { 
                        style: 'currency', 
                        currency: 'INR' 
                      }).format((summary.totalDeposits || 0) - (summary.totalWithdrawals || 0))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {summary.totalCount || 0}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering transaction summary:", error);
      return (
        <div className="p-6 text-center">
          <p className="text-red-500 mb-2">Error loading transaction data</p>
          <button 
            onClick={fetchReportData} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      );
    }
  };

  // Function to render balance summary report
  const renderBalanceSummary = () => {
    if (!reportData || !reportData.data) {
      return <div className="p-6 text-center">No data available</div>;
    }

    const { data } = reportData;
    
    // Prepare data for the pie charts
    const bankChartData = {
      labels: data.banks ? data.banks.map(bank => bank.bank_name) : [],
      datasets: [{
        label: 'Bank Balances',
        data: data.banks ? data.banks.map(bank => bank.current_balance) : [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    };

    const websiteChartData = {
      labels: data.websites ? data.websites.map(site => site.website_name) : [],
      datasets: [{
        label: 'Website Balances',
        data: data.websites ? data.websites.map(site => site.current_balance) : [],
        backgroundColor: [
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }]
    };

    const totalBankBalance = data.totalBankBalance || 0;
    const totalWebsiteBalance = data.totalWebsiteBalance || 0;
    const netBalance = data.netBalance || 0;
    
    // Summary chart data
    const summaryChartData = {
      labels: ['Bank Balance', 'Website Balance', 'Net Balance'],
      datasets: [{
        label: 'Balance Summary',
        data: [totalBankBalance, totalWebsiteBalance, netBalance],
        backgroundColor: [
          colors.bank,
          colors.website,
          colors.net
        ],
        borderColor: [
          colors.bank.replace('0.6', '1'),
          colors.website.replace('0.6', '1'),
          colors.net.replace('0.6', '1')
        ],
        borderWidth: 1
      }]
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Balance Summary Report</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-700 mb-2">Total Bank Balance</h4>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('en-IN', { 
                style: 'currency', 
                currency: 'INR' 
              }).format(totalBankBalance)}
            </p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="text-sm font-medium text-amber-700 mb-2">Total Website Balance</h4>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('en-IN', { 
                style: 'currency', 
                currency: 'INR' 
              }).format(totalWebsiteBalance)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-700 mb-2">Net Balance</h4>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('en-IN', { 
                style: 'currency', 
                currency: 'INR' 
              }).format(netBalance)}
            </p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-center">Bank Balance Distribution</h3>
            <div style={{ height: '300px' }}>
              {data.banks && data.banks.length > 0 ? (
                <Doughnut data={bankChartData} options={{ 
                  ...chartOptions, 
                  plugins: { 
                    ...chartOptions.plugins, 
                    title: { 
                      ...chartOptions.plugins.title, 
                      text: 'Bank Balance Distribution'
                    } 
                  } 
                }} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No bank data available</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-center">Website Balance Distribution</h3>
            <div style={{ height: '300px' }}>
              {data.websites && data.websites.length > 0 ? (
                <Doughnut data={websiteChartData} options={{ 
                  ...chartOptions, 
                  plugins: { 
                    ...chartOptions.plugins, 
                    title: { 
                      ...chartOptions.plugins.title, 
                      text: 'Website Balance Distribution'
                    } 
                  } 
                }} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No website data available</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-center">Balance Summary</h3>
            <div style={{ height: '300px' }}>
              <Bar data={summaryChartData} options={{ 
                ...chartOptions, 
                plugins: { 
                  ...chartOptions.plugins, 
                  title: { 
                    ...chartOptions.plugins.title, 
                    text: 'Balance Summary'
                  } 
                } 
              }} />
            </div>
          </div>
        </div>
        
        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Banks Table */}
          <div>
            <h3 className="text-lg font-medium mb-3">Bank Balances</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Bank Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Current Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.banks && data.banks.length > 0 ? (
                    data.banks.map((bank, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2">{bank.bank_name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {new Intl.NumberFormat('en-IN', { 
                            style: 'currency', 
                            currency: 'INR' 
                          }).format(bank.current_balance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="border border-gray-300 px-4 py-2 text-center">No bank data available</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Total</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {new Intl.NumberFormat('en-IN', { 
                        style: 'currency', 
                        currency: 'INR' 
                      }).format(totalBankBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Websites Table */}
          <div>
            <h3 className="text-lg font-medium mb-3">Website Balances</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Website Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Current Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.websites && data.websites.length > 0 ? (
                    data.websites.map((website, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2">{website.website_name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {new Intl.NumberFormat('en-IN', { 
                            style: 'currency', 
                            currency: 'INR' 
                          }).format(website.current_balance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="border border-gray-300 px-4 py-2 text-center">No website data available</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Total</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {new Intl.NumberFormat('en-IN', { 
                        style: 'currency', 
                        currency: 'INR' 
                      }).format(totalWebsiteBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render user activity report
  const renderUserActivity = () => {
    if (!reportData || !reportData.data) {
      return <div className="p-6 text-center">No data available</div>;
    }

    const { data } = reportData;

    // Prepare data for the chart
    const chartData = {
      labels: data.map(user => user.username || ''),
      datasets: [
        {
          label: 'Transaction Count',
          data: data.map(user => user.totalTransactions || 0),
          backgroundColor: colors.deposit,
          borderColor: colors.deposit.replace('0.6', '1'),
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Amount Processed',
          data: data.map(user => user.totalAmount || 0),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
          type: 'line',
          yAxisID: 'y1'
        }
      ]
    };

    // User activity chart options
    const userActivityOptions = {
      ...chartOptions,
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Transaction Count'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: 'Amount Processed'
          },
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-IN', { 
                style: 'currency', 
                currency: 'INR',
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value);
            }
          }
        }
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">User Activity Report</h2>
        
        {/* Chart */}
        <div className="mb-6" style={{ height: '400px' }}>
          <Bar data={chartData} options={userActivityOptions} />
        </div>
        
        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">Transactions</th>
                <th className="border border-gray-300 px-4 py-2">Amount Processed</th>
                <th className="border border-gray-300 px-4 py-2">First Activity</th>
                <th className="border border-gray-300 px-4 py-2">Last Activity</th>
                <th className="border border-gray-300 px-4 py-2">Days Active</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((user, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{user.totalTransactions || 0}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {new Intl.NumberFormat('en-IN', { 
                        style: 'currency', 
                        currency: 'INR',
                        maximumFractionDigits: 0 
                      }).format(user.totalAmount || 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {user.firstActivity ? format(new Date(user.firstActivity), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {user.lastActivity ? format(new Date(user.lastActivity), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {Math.round(user.daysActive) || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border border-gray-300 px-4 py-2 text-center">No data available</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td className="border border-gray-300 px-4 py-2">Total</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {data.reduce((sum, user) => sum + (user.totalTransactions || 0), 0)}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {new Intl.NumberFormat('en-IN', { 
                    style: 'currency', 
                    currency: 'INR',
                    maximumFractionDigits: 0
                  }).format(data.reduce((sum, user) => sum + (user.totalAmount || 0), 0))}
                </td>
                <td className="border border-gray-300 px-4 py-2" colSpan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // Function to render trend analysis report
  const renderTrendAnalysis = () => {
    if (!reportData || !reportData.data) {
      return <div className="p-6 text-center">No data available</div>;
    }

    const { data } = reportData;
    
    // Prepare data for the line chart
    const chartData = {
      labels: data.map(item => typeof item.date === 'string' ? item.date.substring(0, 10) : item.label || ''),
      datasets: [
        {
          label: 'Deposits',
          data: data.map(item => item.depositAmount || 0),
          borderColor: colors.deposit.replace('0.6', '1'),
          backgroundColor: colors.deposit.replace('0.6', '0.2'),
          fill: true,
          tension: 0.4
        },
        {
          label: 'Withdrawals',
          data: data.map(item => item.withdrawAmount || 0),
          borderColor: colors.withdraw.replace('0.6', '1'),
          backgroundColor: colors.withdraw.replace('0.6', '0.2'),
          fill: true,
          tension: 0.4
        },
        {
          label: 'Net Flow',
          data: data.map(item => (item.depositAmount || 0) - (item.withdrawAmount || 0)),
          borderColor: colors.net.replace('0.6', '1'),
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: colors.net.replace('0.6', '1')
        }
      ]
    };

    // Trend analysis options
    const trendOptions = {
      ...chartOptions,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Amount (INR)'
          },
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-IN', { 
                style: 'currency', 
                currency: 'INR',
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value);
            }
          }
        }
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Transaction Trend Analysis</h2>
        
        {/* Chart */}
        <div className="mb-6" style={{ height: '400px' }}>
          <Line data={chartData} options={trendOptions} />
        </div>
        
        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2">Date/Period</th>
                <th className="border border-gray-300 px-4 py-2">Deposits</th>
                <th className="border border-gray-300 px-4 py-2">Withdrawals</th>
                <th className="border border-gray-300 px-4 py-2">Net Flow</th>
                <th className="border border-gray-300 px-4 py-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => {
                  // Calculate trend direction compared to previous period
                  let trendIcon = null;
                  if (index > 0) {
                    const currentNet = (item.depositAmount || 0) - (item.withdrawAmount || 0);
                    const prevNet = (data[index-1].depositAmount || 0) - (data[index-1].withdrawAmount || 0);
                    if (currentNet > prevNet) {
                      trendIcon = <span className="text-green-500">↑</span>;
                    } else if (currentNet < prevNet) {
                      trendIcon = <span className="text-red-500">↓</span>;
                    } else {
                      trendIcon = <span className="text-gray-500">→</span>;
                    }
                  }
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.date ? (typeof item.date === 'string' ? item.date.substring(0, 10) : format(new Date(item.date), 'yyyy-MM-dd')) : item.label || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                        {new Intl.NumberFormat('en-IN', { 
                          style: 'currency', 
                          currency: 'INR',
                          maximumFractionDigits: 0 
                        }).format(item.depositAmount || 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-red-600">
                        {new Intl.NumberFormat('en-IN', { 
                          style: 'currency', 
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(item.withdrawAmount || 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {new Intl.NumberFormat('en-IN', { 
                          style: 'currency', 
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format((item.depositAmount || 0) - (item.withdrawAmount || 0))}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-xl">
                        {trendIcon || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="border border-gray-300 px-4 py-2 text-center">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            Reports & Analytics
          </h1>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 text-white font-semibold px-6 py-2 rounded transition duration-300 shadow flex items-center space-x-2"
              onClick={exportToExcel}
              disabled={!reportData}
            >
              <FaDownload />
              <span>Export</span>
            </button>
            <button
              className="bg-green-500 text-white font-semibold px-6 py-2 rounded transition duration-300 shadow flex items-center space-x-2"
              onClick={fetchReportData}
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaChartLine className="mr-2" />
            Select Report Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              className={`p-4 rounded-lg border ${reportType === 'systemOverview' ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'} hover:bg-blue-50 transition duration-200`}
              onClick={() => setReportType('systemOverview')}
            >
              <FaInfoCircle className="mx-auto text-2xl mb-2 text-blue-500" />
              <h3 className="text-sm font-medium text-center">System Overview</h3>
            </button>
            <button
              className={`p-4 rounded-lg border ${reportType === 'transactionSummary' ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'} hover:bg-blue-50 transition duration-200`}
              onClick={() => setReportType('transactionSummary')}
            >
              <FaChartBar className="mx-auto text-2xl mb-2 text-blue-500" />
              <h3 className="text-sm font-medium text-center">Transaction Summary</h3>
            </button>
            <button
              className={`p-4 rounded-lg border ${reportType === 'balanceSummary' ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'} hover:bg-blue-50 transition duration-200`}
              onClick={() => setReportType('balanceSummary')}
            >
              <FaChartPie className="mx-auto text-2xl mb-2 text-blue-500" />
              <h3 className="text-sm font-medium text-center">Balance Summary</h3>
            </button>
            <button
              className={`p-4 rounded-lg border ${reportType === 'userActivity' ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'} hover:bg-blue-50 transition duration-200`}
              onClick={() => setReportType('userActivity')}
            >
              <FaChartBar className="mx-auto text-2xl mb-2 text-blue-500" />
              <h3 className="text-sm font-medium text-center">User Activity</h3>
            </button>
            <button
              className={`p-4 rounded-lg border ${reportType === 'trendAnalysis' ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'} hover:bg-blue-50 transition duration-200`}
              onClick={() => setReportType('trendAnalysis')}
            >
              <FaChartLine className="mx-auto text-2xl mb-2 text-blue-500" />
              <h3 className="text-sm font-medium text-center">Trend Analysis</h3>
            </button>
          </div>
        </div>

        {/* Filters */}
        {reportType !== 'systemOverview' && reportType !== 'balanceSummary' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaFilter className="mr-2" />
              Filters & Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex space-x-2 items-center">
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                  <button 
                    className="text-blue-500 hover:text-blue-700" 
                    onClick={resetToCurrentMonth}
                    title="Reset to current month"
                  >
                    <FaSync />
                  </button>
                </div>
              </div>

              {/* Group By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={filters.groupBy}
                  onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                >
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  {reportType === 'transactionSummary' && (
                    <>
                      <option value="bank">Bank</option>
                      <option value="website">Website</option>
                      <option value="user">User</option>
                    </>
                  )}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex space-x-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="date">Date</option>
                    {reportType === 'transactionSummary' && (
                      <>
                        <option value="totalAmount">Total Amount</option>
                        <option value="depositAmount">Deposit Amount</option>
                        <option value="withdrawAmount">Withdraw Amount</option>
                        <option value="netFlow">Net Flow</option>
                        <option value="count">Count</option>
                      </>
                    )}
                    {reportType === 'userActivity' && (
                      <>
                        <option value="totalTransactions">Transaction Count</option>
                        <option value="totalAmount">Amount</option>
                        <option value="daysActive">Days Active</option>
                      </>
                    )}
                  </select>
                  <select
                    className="w-24 border border-gray-300 rounded-md p-2 text-sm"
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
              </div>

              {/* Bank Filter */}
              {(reportType === 'transactionSummary' || reportType === 'trendAnalysis') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    value={filters.bankFilter}
                    onChange={(e) => handleFilterChange('bankFilter', e.target.value)}
                  >
                    <option value="">All Banks</option>
                    {availableBanks.map((bank, index) => (
                      <option key={index} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Website Filter */}
              {(reportType === 'transactionSummary' || reportType === 'trendAnalysis') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    value={filters.websiteFilter}
                    onChange={(e) => handleFilterChange('websiteFilter', e.target.value)}
                  >
                    <option value="">All Websites</option>
                    {availableWebsites.map((website, index) => (
                      <option key={index} value={website}>{website}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* User Filter */}
              {(reportType === 'userActivity' || reportType === 'transactionSummary' || reportType === 'trendAnalysis') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    value={filters.userFilter}
                    onChange={(e) => handleFilterChange('userFilter', e.target.value)}
                  >
                    <option value="">All Users</option>
                    {availableUsers.map((user, index) => (
                      <option key={index} value={user}>{user}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Content */}
        {loading ? (
          <div className="flex justify-center p-12">
            <FullScreenLoader />
          </div>
        ) : (
          renderReportContent()
        )}
      </div>
    </div>
  );
};

export default ReportsPage;