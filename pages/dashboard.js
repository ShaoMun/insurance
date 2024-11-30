"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { useWallet } from '../context/WalletContext';

export default function Dashboard() {
  const { account } = useWallet();
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await contract.getUserData(account);
      setDashboardData(data);
    } catch {
      console.error("Error fetching dashboard data");
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getClaimStatus = (status) => {
    return status;
  };

  const getTimeRemaining = (timestamp) => {
    return timestamp;
  };

  return (
    <div className="dashboard-new">
      {/* ... other JSX ... */}
      <p>Don&apos;t miss out on the opportunity...</p>
      {/* ... other JSX ... */}
    </div>
  );
}
