"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  useGetUsersQuery,
  useGetOrdersQuery,
  useGetDeliveryPartnersQuery,
  useGetFoodsQuery,
  useGetGroceriesQuery,
  useGetToyboxzQuery,
  useGetVegFruitsQuery,
  useGetAllWithdrawalsQuery,
} from '../services/reduxApi'
import '../styles/dashboard.css'

// Register required Chart.js elements and scales
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
)

interface DashboardStats {
  users: number
  orders: number
  deliveredOrders: number
  partners: number
  approvedPartners: number
  pendingPartners: number
  rejectedPartners: number
  foods: number
  groceries: number
  toyboxz: number
  vegFruits: number
  withdrawals: number
  pendingWithdrawals: number
  approvedWithdrawals: number
  rejectedWithdrawals: number
  totalRevenue: number
  pendingWithdrawalAmount: number
  approvedWithdrawalAmount: number
  ordersTrend: any
  revenueTrend: any
  orderStatusPie: any
  partnerStatusPie: any
  recentOrders: any[]
  recentWithdrawals: any[]
}

const Dashboard: React.FC = () => {
  const { email } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery()
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery()
  const { data: partners = [], isLoading: partnersLoading } = useGetDeliveryPartnersQuery()
  const { data: foods = [], isLoading: foodsLoading } = useGetFoodsQuery()
  const { data: groceries = [], isLoading: groceriesLoading } = useGetGroceriesQuery()
  const { data: toyboxz = [], isLoading: toyboxzLoading } = useGetToyboxzQuery()
  const { data: vegFruits = [], isLoading: vegFruitsLoading } = useGetVegFruitsQuery()
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useGetAllWithdrawalsQuery(undefined)

  const loading = usersLoading || ordersLoading || partnersLoading || foodsLoading || groceriesLoading || toyboxzLoading || vegFruitsLoading || withdrawalsLoading

  useEffect(() => {
    if (!loading && users && orders && partners && foods && groceries && toyboxz && vegFruits && withdrawals) {
      // Order status breakdown
      const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED')

      // Partner status breakdown
      const approvedPartners = partners.filter((p: any) => p.status === 'Approved')
      const pendingPartners = partners.filter((p: any) => p.status === 'Pending')
      const rejectedPartners = partners.filter((p: any) => p.status === 'Rejected')

      // Withdrawal status breakdown
      const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'Pending')
      const approvedWithdrawals = withdrawals.filter((w: any) => w.status === 'Approved')
      const rejectedWithdrawals = withdrawals.filter((w: any) => w.status === 'Rejected')

      // Revenue (delivered orders × 30)
      const totalRevenue = deliveredOrders.length * 30

      // Pending/approved withdrawal amounts
      const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum: number, w: any) => sum + w.amount, 0)
      const approvedWithdrawalAmount = approvedWithdrawals.reduce((sum: number, w: any) => sum + w.amount, 0)

      // Advanced: Orders/revenue trend (last 7 days)
      const today = new Date()
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (6 - i))
        return d
      })

      const ordersByDay = days.map(day =>
        orders.filter((o: any) => {
          const od = new Date(o.createdAt)
          return od.toDateString() === day.toDateString()
        })
      )

      const deliveredByDay = days.map((day, i) =>
        ordersByDay[i].filter((o: any) => o.status === 'DELIVERED')
      )

      const ordersTrend = {
        labels: days.map(d => d.toLocaleDateString()),
        datasets: [
          {
            label: 'Orders',
            data: ordersByDay.map(arr => arr.length),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Delivered',
            data: deliveredByDay.map(arr => arr.length),
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4,
          },
        ],
      }

      const revenueTrend = {
        labels: days.map(d => d.toLocaleDateString()),
        datasets: [
          {
            label: 'Revenue (₹)',
            data: deliveredByDay.map(arr => arr.length * 30),
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4,
          },
        ],
      }

      // Pie chart for order status
      const orderStatusCounts: Record<string, number> = {}
      orders.forEach((o: any) => {
        orderStatusCounts[o.status] = (orderStatusCounts[o.status] || 0) + 1
      })

      const orderStatusPie = {
        labels: Object.keys(orderStatusCounts),
        datasets: [
          {
            data: Object.values(orderStatusCounts),
            backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'],
          },
        ],
      }

      // Pie chart for partner status
      const partnerStatusCounts: Record<string, number> = {}
      partners.forEach((p: any) => {
        partnerStatusCounts[p.status || 'Unknown'] = (partnerStatusCounts[p.status || 'Unknown'] || 0) + 1
      })

      const partnerStatusPie = {
        labels: Object.keys(partnerStatusCounts),
        datasets: [
          {
            data: Object.values(partnerStatusCounts),
            backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9c27b0'],
          },
        ],
      }

      // Recent activity
      const recentOrders = [...orders]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      const recentWithdrawals = [...withdrawals]
        .sort((a: any, b: any) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
        .slice(0, 5)

      setStats({
        users: users.length,
        orders: orders.length,
        deliveredOrders: deliveredOrders.length,
        partners: partners.length,
        approvedPartners: approvedPartners.length,
        pendingPartners: pendingPartners.length,
        rejectedPartners: rejectedPartners.length,
        foods: foods.length,
        groceries: groceries.length,
        toyboxz: toyboxz.length,
        vegFruits: vegFruits.length,
        withdrawals: withdrawals.length,
        pendingWithdrawals: pendingWithdrawals.length,
        approvedWithdrawals: approvedWithdrawals.length,
        rejectedWithdrawals: rejectedWithdrawals.length,
        totalRevenue,
        pendingWithdrawalAmount,
        approvedWithdrawalAmount,
        ordersTrend,
        revenueTrend,
        orderStatusPie,
        partnerStatusPie,
        recentOrders,
        recentWithdrawals,
      })
    }
  }, [users, orders, partners, foods, groceries, toyboxz, vegFruits, withdrawals, loading]);

  return (
    <div className="dashboard-management">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">📊 Dashboard Overview</h1>
          <p className="dashboard-subtitle">Welcome back, {email}</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : stats && (
          <>
            {/* Main Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.users}</h3>
                  <p className="stat-label">Total Users</p>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.orders}</h3>
                  <p className="stat-label">Total Orders</p>
                  <p className="stat-detail">Delivered: {stats.deliveredOrders}</p>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">🚚</div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.partners}</h3>
                  <p className="stat-label">Delivery Partners</p>
                  <p className="stat-detail">
                    Approved: {stats.approvedPartners} | Pending: {stats.pendingPartners}
                  </p>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">🛍️</div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.foods + stats.groceries + stats.toyboxz + stats.vegFruits}</h3>
                  <p className="stat-label">Total Products</p>
                  <p className="stat-detail">
                    Food: {stats.foods} | Grocery: {stats.groceries} | Toys: {stats.toyboxz} | Veg: {stats.vegFruits}
                  </p>
                </div>
              </div>

              <div className="stat-card danger">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.withdrawals}</h3>
                  <p className="stat-label">Withdrawals</p>
                  <p className="stat-detail">
                    Pending: {stats.pendingWithdrawals} | Approved: {stats.approvedWithdrawals}
                  </p>
                </div>
              </div>

              <div className="stat-card revenue">
                <div className="stat-icon">💵</div>
                <div className="stat-content">
                  <h3 className="stat-number">₹{stats.totalRevenue.toLocaleString()}</h3>
                  <p className="stat-label">Total Revenue</p>
                  <p className="stat-detail">
                    Pending: ₹{stats.pendingWithdrawalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>📈 Orders Trend (Last 7 Days)</h3>
                </div>
                <div className="chart-content">
                  <Line 
                    data={stats.ordersTrend} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: '#888'
                          },
                          grid: {
                            color: '#333'
                          }
                        },
                        y: {
                          ticks: {
                            color: '#888'
                          },
                          grid: {
                            color: '#333'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>💰 Revenue Trend (Last 7 Days)</h3>
                </div>
                <div className="chart-content">
                  <Line 
                    data={stats.revenueTrend}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: '#888'
                          },
                          grid: {
                            color: '#333'
                          }
                        },
                        y: {
                          ticks: {
                            color: '#888'
                          },
                          grid: {
                            color: '#333'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>📊 Order Status Breakdown</h3>
                </div>
                <div className="chart-content pie-chart">
                  <Pie 
                    data={stats.orderStatusPie}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>🚚 Partner Status Distribution</h3>
                </div>
                <div className="chart-content pie-chart">
                  <Pie 
                    data={stats.partnerStatusPie}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Activity Grid */}
            <div className="activity-grid">
              <div className="activity-card">
                <div className="activity-header">
                  <h3>🕒 Recent Orders</h3>
                </div>
                <div className="activity-content">
                  {stats.recentOrders.length === 0 ? (
                    <div className="empty-state">
                      <p>No recent orders</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="activity-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>User Email</th>
                            <th>Status</th>
                            <th>Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentOrders.map((o: any) => (
                            <tr key={o._id}>
                              <td className="order-id">{o._id.slice(-8)}</td>
                              <td>{o.userEmail}</td>
                              <td>
                                <span className={`status-badge ${o.status.toLowerCase()}`}>
                                  {o.status}
                                </span>
                              </td>
                              <td>{o.createdAt && new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="activity-card">
                <div className="activity-header">
                  <h3>💸 Recent Withdrawals</h3>
                </div>
                <div className="activity-content">
                  {stats.recentWithdrawals.length === 0 ? (
                    <div className="empty-state">
                      <p>No recent withdrawals</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="activity-table">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>Partner Email</th>
                            <th>Status</th>
                            <th>Requested At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentWithdrawals.map((w: any) => (
                            <tr key={w._id}>
                              <td className="amount">₹{w.amount.toLocaleString()}</td>
                              <td>{w.email}</td>
                              <td>
                                <span className={`status-badge ${w.status.toLowerCase()}`}>
                                  {w.status}
                                </span>
                              </td>
                              <td>{w.requestedAt && new Date(w.requestedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
