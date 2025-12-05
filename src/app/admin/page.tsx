'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Chart from 'chart.js/auto';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Order {
    id: string;
    customer: string;
    total: number;
    status: string;
    createdAt?: any;
}

export default function DashboardHome() {
    const salesChartRef = useRef<HTMLCanvasElement>(null);
    const trafficChartRef = useRef<HTMLCanvasElement>(null);
    const salesChartInstance = useRef<any>(null);
    const trafficChartInstance = useRef<any>(null);

    // Data State
    const [totalRevenue, setTotalRevenue] = useState(405231.89); // Simulated start
    const [totalOrders, setTotalOrders] = useState(0); // Will fetch real
    const [newCustomers, setNewCustomers] = useState(1892); // Simulated
    const [liveVisitors, setLiveVisitors] = useState(128); // Simulated
    const [revenueData, setRevenueData] = useState([35000, 42000, 68000, 59000, 82000, 75000, 91000, 88000, 110000, 105000, 130000, 125000]);
    const [trafficData, setTrafficData] = useState([45, 25, 20, 10]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);

    // AI Insights State
    const [aiInsights, setAiInsights] = useState("Click 'Refresh' to get AI-powered insights on your current dashboard data.");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    // Fetch Real Data
    useEffect(() => {
        async function fetchRealData() {
            try {
                const ordersRef = collection(db, 'orders');
                const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(5));
                const snapshot = await getDocs(q);
                
                const orders = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        customer: data.customerInfo 
                            ? `${data.customerInfo.firstName} ${data.customerInfo.lastName}`
                            : data.shippingAddress?.name || 'Unknown',
                        total: data.total || data.totalAmount || 0,
                        status: data.status === 'completed' ? 'Paid' : 
                                data.status === 'pending' ? 'Pending' : 
                                data.status === 'cancelled' ? 'Failed' : 'Pending', // Map to UI statuses
                        createdAt: data.createdAt
                    };
                });
                setRecentOrders(orders);

                // For total orders, we'll just use a placeholder + real count of recent fetch for now to avoid reading all docs
                // In a real app, use a counter document or aggregation query
                setTotalOrders(21452 + snapshot.size); 

            } catch (err) {
                console.error("Error fetching real data:", err);
            }
        }
        fetchRealData();
    }, []);

    // Function to fetch AI insights
    const generateInsights = async () => {
        setIsGenerating(true);
        setError(null);
        setAiInsights('');
        try {
            // Check for API key (simulated check as we might not have it in env yet)
            // In a real scenario, this would be process.env.NEXT_PUBLIC_GEMINI_API_KEY
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            
            if (!apiKey) {
                throw new Error("API key not configured.");
            }
            const ai = new GoogleGenerativeAI(apiKey);

            const currentData = {
                totalRevenue,
                totalOrders,
                newCustomers,
                liveVisitors,
                todayRevenue: revenueData[revenueData.length - 1],
                trafficSources: {
                    organic: trafficData[0],
                    social: trafficData[1],
                    direct: trafficData[2],
                    referral: trafficData[3],
                },
            };
            
            const prompt = `You are an expert e-commerce analyst for a platform called TransferNest. Based on the following JSON data for an online store, provide a concise summary and 2-3 actionable recommendations. Use markdown for formatting (e.g., "**Summary**" for headings and "*" for bullet points). The data is: ${JSON.stringify(currentData)}. Keep your response professional, insightful, and brief.`;

            const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            setAiInsights(response.text());

        } catch (err) {
            console.error("Error fetching AI insights:", err);
            const errorMessage = (err instanceof Error && err.message.includes("API key"))
                ? "AI features are unavailable due to a configuration issue (Missing API Key)."
                : "Failed to generate insights. Please try again later.";
            setError(errorMessage);
            setAiInsights('');
        } finally {
            setIsGenerating(false);
        }
    };

    // Chart Initialization Effect
    useEffect(() => {
        const initCharts = () => {
            if (typeof Chart === 'undefined') return false;

            if (salesChartRef.current && !salesChartInstance.current) {
                const salesChartCtx = salesChartRef.current.getContext('2d');
                if (salesChartCtx) {
                    const salesGradient = salesChartCtx.createLinearGradient(0, 0, 0, 300);
                    salesGradient.addColorStop(0, 'rgba(167, 139, 250, 0.6)');
                    salesGradient.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
                    salesChartInstance.current = new Chart(salesChartCtx, {
                        type: 'line',
                        data: {
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                            datasets: [{ label: 'Revenue', data: revenueData, backgroundColor: salesGradient, borderColor: '#a78bfa', pointBackgroundColor: '#ffffff', pointBorderColor: '#a78bfa', pointHoverRadius: 7, pointHoverBackgroundColor: '#a78bfa', pointHoverBorderColor: '#ffffff', tension: 0.4, fill: 'start' }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', titleColor: '#e5e7eb', bodyColor: '#d1d5db', padding: 12, cornerRadius: 6, displayColors: false } }, scales: { y: { beginAtZero: false, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#9ca3af', callback: (value: any) => '$' + value / 1000 + 'k' } }, x: { grid: { display: false }, ticks: { color: '#9ca3af' } } } }
                    });
                }
            }

            if (trafficChartRef.current && !trafficChartInstance.current) {
                const trafficChartCtx = trafficChartRef.current.getContext('2d');
                if (trafficChartCtx) {
                    trafficChartInstance.current = new Chart(trafficChartCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Organic Search', 'Social Media', 'Direct', 'Referral'],
                            datasets: [{ data: trafficData, backgroundColor: ['#a78bfa', '#06b6d4', '#6366f1', '#374151'], borderColor: '#111827', borderWidth: 3, hoverOffset: 10 }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#d1d5db', padding: 20, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { backgroundColor: '#1f2937', titleColor: '#e5e7eb', bodyColor: '#d1d5db', padding: 12, cornerRadius: 6, displayColors: false, callbacks: { label: (context: any) => `${context.label || ''}: ${context.parsed || 0}%` } } } }
                    });
                }
            }
            return true;
        };

        // Small delay to ensure canvas is ready
        const timeout = setTimeout(initCharts, 100);
        return () => {
            clearTimeout(timeout);
            if (salesChartInstance.current) salesChartInstance.current.destroy();
            if (trafficChartInstance.current) trafficChartInstance.current.destroy();
        };
    }, []);

    // Data Simulation & Chart Update Effect
    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate metrics
            setTotalRevenue(prev => prev + Math.random() * 500);
            // setTotalOrders(prev => prev + Math.floor(Math.random() * 3)); // Keep real orders count stable for now
            setNewCustomers(prev => (Math.random() > 0.5 ? prev + 1 : prev));
            setLiveVisitors(prev => Math.max(50, prev + Math.floor(Math.random() * 21) - 10));
            
            // Simulate chart data
            setRevenueData(prev => {
                const newData = [...prev];
                newData[newData.length - 1] = prev[prev.length - 1] + Math.random() * 2000;
                if (salesChartInstance.current) {
                    salesChartInstance.current.data.datasets[0].data = newData;
                    salesChartInstance.current.update('none');
                }
                return newData;
            });
            setTrafficData(prev => {
                const changes = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1];
                const newRawData = prev.map((val, i) => Math.max(5, val + changes[i]));
                const total = newRawData.reduce((sum, val) => sum + val, 0);
                const newData = newRawData.map(val => Math.round((val / total) * 100));
                 if (trafficChartInstance.current) {
                    trafficChartInstance.current.data.datasets[0].data = newData;
                    trafficChartInstance.current.update('none');
                }
                return newData;
            });

        }, 3000);

        return () => clearInterval(interval);
    }, []);
    
    // AI Insight renderer
    const renderInsights = () => {
        if (isGenerating) {
            return (
                <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6 mt-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                </div>
            );
        }
        if (error) {
            return <p className="text-red-400">{error}</p>;
        }
    
        const lines = aiInsights.split('\n').filter(line => line.trim() !== '');
    
        return (
            <div className="text-gray-300 space-y-2">
                {lines.map((line, index) => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                        return (
                            <div key={index} className="flex items-start">
                                <span className="text-cyan-400 mr-2 mt-1">•</span>
                                <span>{trimmedLine.substring(2)}</span>
                            </div>
                        );
                    }
                    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                        return <p key={index} className="font-semibold text-white mt-3 first:mt-0">{trimmedLine.slice(2, -2)}</p>;
                    }
                    return <p key={index}>{line}</p>;
                })}
            </div>
        );
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.1s'}}>
                    <p className="text-sm text-gray-400 mb-2">Total Revenue</p>
                    <p className="text-3xl font-bold text-white mb-2">{formatCurrency(totalRevenue)}</p>
                    <span className="text-sm text-green-400">+12.5% from last month</span>
                </div>
                
                <div className="dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.2s'}}>
                    <p className="text-sm text-gray-400 mb-2">Total Orders</p>
                    <p className="text-3xl font-bold text-white mb-2">{totalOrders.toLocaleString()}</p>
                    <span className="text-sm text-green-400">+8.1% from last month</span>
                </div>

                <div className="dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.3s'}}>
                    <p className="text-sm text-gray-400 mb-2">New Customers</p>
                    <p className="text-3xl font-bold text-white mb-2">{newCustomers.toLocaleString()}</p>
                    <span className="text-sm text-red-400">-2.3% from last month</span>
                </div>

                <div className="lg:col-span-2 dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.4s'}}>
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue Overview</h3>
                    <div className="h-80">
                        <canvas ref={salesChartRef}></canvas>
                    </div>
                </div>

                <div className="dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.5s'}}>
                    <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
                    <div className="h-80 flex items-center justify-center">
                        <canvas ref={trafficChartRef}></canvas>
                    </div>
                </div>
                
                 <div className="lg:col-span-2 dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.6s'}}>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700 text-sm text-gray-400">
                                    <th className="py-3 pr-3">Order ID</th>
                                    <th className="py-3 pr-3">Customer</th>
                                    <th className="py-3 pr-3">Total</th>
                                    <th className="py-3 pr-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                                        <td className="py-4 pr-3 text-cyan-400 font-mono">
                                            <Link href={`/admin/jobs/${order.id}`}>
                                                #{order.id.slice(-6)}
                                            </Link>
                                        </td>
                                        <td className="py-4 pr-3">{order.customer}</td>
                                        <td className="py-4 pr-3">{formatCurrency(order.total)}</td>
                                        <td className="py-4 pr-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                order.status === 'Paid' ? 'bg-green-800 text-green-300' :
                                                order.status === 'Pending' ? 'bg-yellow-800 text-yellow-300' :
                                                'bg-red-800 text-red-300'
                                            }`}>{order.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-500">No recent orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.7s'}}>
                    <h3 className="text-lg font-semibold text-white mb-4">Live Visitors</h3>
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative globe mb-4">
                            <div className="pulse-point" style={{top: '30%', left: '60%', animationDelay: '0.2s'}}></div>
                            <div className="pulse-point" style={{top: '50%', left: '40%', animationDelay: '0.5s'}}></div>
                            <div className="pulse-point" style={{top: '65%', left: '70%', animationDelay: '1.1s'}}></div>
                            <div className="pulse-point" style={{top: '40%', left: '20%'}}></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{liveVisitors}</p>
                        <p className="text-sm text-gray-400">Visitors online now</p>
                    </div>
                </div>

                 <div className="lg:col-span-3 dash-glass-card rounded-2xl p-6 fade-in-widget" style={{animationDelay: '0.8s'}}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 text-purple-400"><path d="M11.47 1.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72V7.5h-1.5V4.06L9.53 5.78a.75.75 0 0 1-1.06-1.06l3-3ZM11.25 7.5V11.25l2.28 2.28a.75.75 0 0 1-1.06 1.06L11.25 13.062V15a.75.75 0 0 1-1.5 0v-3.75l-2.28 2.28a.75.75 0 1 1-1.06-1.06L8.25 11.25V7.5a.75.75 0 0 1 1.5 0Zm-2.822 8.72a.75.75 0 0 1 1.06 0l1.72 1.72V20.25h1.5v-2.25l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z" /></svg>
                            TransferNest AI Insights
                        </h3>
                        <button onClick={generateInsights} disabled={isGenerating} className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Refresh
                        </button>
                    </div>
                    {renderInsights()}
                </div>
            </div>
        </>
    );
}
